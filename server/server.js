require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const debugMode = process.env.DEBUG_MODE === 'true';

// Utility function to log messages to a file
function logToFile(message) {
  const logPath = path.join(__dirname, 'chatbot.log');
  fs.appendFileSync(logPath, `${new Date().toISOString()} - ${message}\n`);
}

// Verify that all necessary environment variables are loaded
const requiredEnvVars = ['MONGODB_URI', 'MONGODB_DB', 'MONGODB_COLLECTION', 'OPENAI_API_KEY'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Error: Environment variable ${varName} is not set`);
    process.exit(1);
  }
});

// Logging environment variables for debugging
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('MONGODB_DB:', process.env.MONGODB_DB);
console.log('MONGODB_COLLECTION:', process.env.MONGODB_COLLECTION);
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);

async function generateEmbeddings(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    logToFile(`Sending data to AI: ${text}`);
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embeddings:', error.response ? error.response.data : error.message);
    logToFile(`Error generating embeddings: ${error.message}`);
    throw error;
  }
}

async function findRelevantDocuments(query) {
  const queryEmbedding = await generateEmbeddings(query);
  logToFile(`Generated query embedding: ${queryEmbedding}`);

  console.log('Connecting to MongoDB with URI:', process.env.MONGODB_URI);
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB);
  const collection = db.collection(process.env.MONGODB_COLLECTION);

  try {
    // Search in question_embedding
    const questionResults = await collection.aggregate([
      {
        '$vectorSearch': {
          'index': 'question_index',
          'path': 'question_embedding',
          'queryVector': queryEmbedding,
          'numCandidates': 10,
          'limit': 2
        }
      },
      {
        '$project': {
          '_id': 0,
          'question': 1,
          'answer': 1,
          'score': {
            '$meta': 'vectorSearchScore'
          }
        }
      }
    ]).toArray();

    // Search in answer_embedding
    const answerResults = await collection.aggregate([
      {
        '$vectorSearch': {
          'index': 'answer_index',
          'path': 'answer_embedding',
          'queryVector': queryEmbedding,
          'numCandidates': 10,
          'limit': 2
        }
      },
      {
        '$project': {
          '_id': 0,
          'question': 1,
          'answer': 1,
          'score': {
            '$meta': 'vectorSearchScore'
          }
        }
      }
    ]).toArray();

    // Combine results and handle duplicates
    const combinedResults = [...questionResults, ...answerResults];
    const uniqueResults = combinedResults.reduce((acc, current) => {
      const x = acc.find(item => item.question === current.question && item.answer === current.answer);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);

    logToFile(`Found ${uniqueResults.length} relevant documents`);
    return { uniqueResults, queryEmbedding };
  } catch (error) {
    logToFile(`Error finding documents: ${error.message}`);
    throw error;
  } finally {
    await client.close();
  }
}

async function getChatCompletion(messages) {
  try {
    logToFile(`Generating chat completion for messages: ${JSON.stringify(messages)}`);
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
    });

    const completion = response.choices[0].message.content;
    logToFile(`Generated chat completion: ${completion}`);
    return completion;
  } catch (error) {
    console.error('Error generating chat completion:', error.response ? error.response.data : error.message);
    logToFile(`Error generating chat completion: ${error.message}`);
    throw error;
  }
}

// Helper function to summarize or truncate context
function getSummarizedContext(documents, maxTokens = 7000) {
  let context = '';
  let tokens = 0;

  for (const doc of documents) {
    const contentTokens = doc.answer.split(' ').length;
    if (tokens + contentTokens <= maxTokens) {
      context += `**Answer**: ${doc.answer} (Score: ${doc.score})\n\n`;
      tokens += contentTokens;
    } else {
      break;
    }
  }

  return context;
}

app.post('/api/chat', async (req, res) => {
  const { query } = req.body;
  let queryEmbedding = null;
  try {
    const { uniqueResults, queryEmbedding: embedding } = await findRelevantDocuments(query);
    queryEmbedding = embedding;
    const context = getSummarizedContext(uniqueResults);
    logToFile(`Context for chat completion: ${context.substring(0, 500)}...`);

    // If relevant documents are found, use the context to answer the question
    let reply = context;

    // If no relevant documents are found, return a default message
    if (!context || context.trim().length === 0) {
      reply = "I'm sorry, I don't know the answer to that question. Please try to rephrase it. Refer to the below information to see if it helps.";
    }

    if (debugMode) {
      res.json({ 
        reply,
        debugInfo: {
          query,
          queryEmbedding,
          relevantDocuments: uniqueResults,
          context
        }
      });
    } else {
      res.json({ reply });
    }
  } catch (error) {
    console.error('Error processing chat:', error);
    logToFile(`Error processing chat: ${error.message}`);
    res.status(500).json({ error: 'Error processing chat' });
  }
});

// Endpoint to serve the sidebar
app.get('/api/sidebar', async (req, res) => {
  try {
    const sidebarConfig = await getSidebarConfig();
    res.json({ sidebar: sidebarConfig });
  } catch (error) {
    console.error('Error fetching sidebar:', error.message);
    res.status(500).json({ error: 'Failed to load sidebar configuration' });
  }
});

// Function to read sidebar configuration using dynamic import
async function getSidebarConfig() {
  const sidebarPath = path.join(__dirname, '../sidebars.js');
  console.log(`Reading sidebar configuration from: ${sidebarPath}`);
  if (fs.existsSync(sidebarPath)) {
    const sidebarConfig = require(sidebarPath);
    console.log('Sidebar configuration loaded successfully');
    return sidebarConfig;
  } else {
    console.error('Sidebar configuration file not found');
    throw new Error('Sidebar configuration file not found');
  }
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  logToFile(`Server started on port ${port}`);
});
