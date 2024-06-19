import os
import markdown
from bs4 import BeautifulSoup
from pymongo import MongoClient
from dotenv import load_dotenv
import openai

# Load environment variables
load_dotenv()

MONGODB_URI = os.getenv('MONGODB_URI')
MONGODB_DB = os.getenv('MONGODB_DB')
MONGODB_COLLECTION = os.getenv('MONGODB_COLLECTION')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Initialize OpenAI API
openai.api_key = OPENAI_API_KEY

def parse_markdown(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    md = markdown.Markdown()
    html_content = md.convert(content)
    soup = BeautifulSoup(html_content, 'html.parser')

    qas = []
    current_question = None
    current_answer = None

    for element in soup.find_all(['h2', 'p']):
        if element.name == 'h2' and 'Question' in element.text:
            if current_question and current_answer:
                qas.append({'question': current_question, 'answer': current_answer})
            current_question = element.text.strip()
            current_answer = None
        elif element.name == 'p' and element.text.startswith('Q:'):
            current_question = element.text[3:].strip()
        elif element.name == 'p' and element.text.startswith('A:'):
            current_answer = element.text[3:].strip()
            if current_question:
                qas.append({'question': current_question, 'answer': current_answer})
                current_question = None
                current_answer = None

    if current_question and current_answer:
        qas.append({'question': current_question, 'answer': current_answer})

    return qas

def generate_embeddings(text):
    response = openai.Embedding.create(model="text-embedding-ada-002", input=text)
    return response['data'][0]['embedding']

def save_to_mongodb(qas):
    client = MongoClient(MONGODB_URI)
    db = client[MONGODB_DB]
    collection = db[MONGODB_COLLECTION]

    for qa in qas:
        question_embedding = generate_embeddings(qa['question'])
        answer_embedding = generate_embeddings(qa['answer'])
        qa_entry = {
            'question': qa['question'],
            'answer': qa['answer'],
            'question_embedding': question_embedding,
            'answer_embedding': answer_embedding
        }
        collection.insert_one(qa_entry)

    client.close()

if __name__ == '__main__':
    # Debugging output to ensure environment variables are loaded
    print(f"MONGODB_URI: {MONGODB_URI}")
    print(f"MONGODB_DB: {MONGODB_DB}")
    print(f"MONGODB_COLLECTION: {MONGODB_COLLECTION}")
    print(f"OPENAI_API_KEY: {OPENAI_API_KEY}")

    file_path = './troubleshooting.md'
    qas = parse_markdown(file_path)
    save_to_mongodb(qas)
