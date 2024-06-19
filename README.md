# MongoDB Lab Assistant

The MongoDB Lab Assistant is a chatbot designed to assist users with questions about the MongoDB Lab Workshop. It uses OpenAI to generate embeddings for questions and answers from a markdown file and stores these embeddings in a MongoDB database. The chatbot then uses these embeddings to find and return relevant answers to user queries.

## Features

- **Question and Answer Embeddings**: The system reads a markdown file containing questions and answers, generates embeddings for each, and stores them in MongoDB.
- **Vector Search**: Utilizes MongoDB's vector search capabilities to find relevant documents based on user queries.
- **Chat Interface**: Provides a chat interface for users to ask questions and receive answers based on the stored data.
- **Debug Mode**: Includes a debug mode to provide detailed information about the embeddings, relevant documents, and context used to generate responses.

## Setup and Installation

### Prerequisites

- Node.js
- MongoDB
- OpenAI API Key

### Installation

1. **Clone the repository**:
    ```bash
    git clone https://github.com/your-repo/mongodb-lab-assistant.git
    cd mongodb-lab-assistant
    ```

2. **Install dependencies**:
    ```bash
    npm install
    ```

3. **Set up environment variables**:
    Create a `.env` file in the root directory and add the following environment variables:
    ```env
    OPENAI_API_KEY=your_openai_api_key
    MONGODB_URI=mongodb+srv://your_mongo_user:your_mongo_password@your_cluster.mongodb.net/lab?retryWrites=true&w=majority&appName=performance
    MONGODB_DB=lab
    MONGODB_COLLECTION=documents
    REACT_APP_SERVER_URL=http://localhost:3001
    DEBUG_MODE=true
    ```

4. **Generate Embeddings**:
    Use the `generate_embeddings.py` script to read the markdown file and store the embeddings in MongoDB:
    ```bash
    python3 generate_embeddings.py
    ```

### Running the Application

1. **Start the server**:
    ```bash
    npm run start:server
    ```

2. **Start the client**:
    ```bash
    npm start
    ```

## Usage

### Asking Questions

Users can interact with the chat interface to ask questions about the MongoDB Lab Workshop. The chatbot will search the database for relevant questions and answers and return the most appropriate responses.

### Debug Mode

When `DEBUG_MODE` is set to `true`, additional debug information will be provided with each response, including the query embeddings, relevant documents, and context used.

## Directory Structure

```
├── LICENSE
├── README.md
├── client
│ ├── Chatbot.css
│ ├── README.md
│ ├── package-lock.json
│ ├── package.json
│ ├── public
│ │ ├── favicon.ico
│ │ ├── index.html
│ │ ├── logo192.png
│ │ ├── logo512.png
│ │ ├── manifest.json
│ │ └── robots.txt
│ └── src
│ ├── App.css
│ ├── App.js
│ ├── App.test.js
│ ├── Chatbot.css
│ ├── index.css
│ ├── index.js
│ ├── logo.svg
│ ├── reportWebVitals.js
│ └── setupTests.js
├── docs
│ ├── generate_embeddings.py
│ ├── troubleshooting.md
├── package-lock.json
├── package.json
├── server
│ ├── chatbot.log
│ └── server.js
└── src
├── components
│ ├── BrowserWindow
│ │ ├── index.js
│ │ └── main.css
│ ├── Chatbot.js
│ ├── HomepageFeatures
│ │ ├── index.js
│ │ └── styles.module.css
│ ├── Link.js
│ ├── Screenshot.js
│ └── Sidebar.js
├── css
│ └── custom.css
└── pages
├── ChatPage.css
├── chat.js
├── helloWorld.js
├── index.js
└── index.module.css
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any bugs or improvements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
