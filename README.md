# AI Symptom Checker

An intelligent web application that leverages a Large Language Model (LLM) to provide a structured, informational analysis of user-reported medical symptoms. The application features a modern, responsive interface and maintains a history of past queries.

---

## 🧠 About The Project

This project is a full-stack MERN application (MongoDB, Express, React, Node.js) designed to serve as an AI-powered medical assistant. Users can input their symptoms, and the backend communicates with the **Groq LLaMA 3 AI** to generate a detailed analysis. The AI's response is structured into a JSON object, allowing the frontend to display the information in a clear, component-based layout, including a summary, potential conditions, and recommended next steps.

---

## ✨ Key Features

- **AI-Powered Analysis:** Integrates with the Groq API for fast, intelligent symptom analysis.
- **Structured Data:** The backend instructs the AI to return a predictable JSON object for easy frontend rendering.
- **Modern UI/UX:** A sleek, responsive dark theme built with React and styled with Tailwind CSS.
- **Interactive Experience:** Users can click to add "refinement" symptoms to their query.
- **Query History:** All searches are saved to a MongoDB database and displayed in a history panel.
- **Full-Stack Architecture:** Decoupled frontend and backend for maintainability and scalability.

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express.js
- MongoDB (with Mongoose)
- Groq SDK (for AI integration)

### Utilities
- dotenv for environment variable management
- cors for cross-origin resource sharing

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites
- Node.js and npm (or yarn) installed
- A MongoDB database URI
- A Groq API Key

### Installation

#### Clone the repository:
```bash
git clone https://github.com/your-username/ai-symptom-checker.git
cd ai-symptom-checker
```

#### Install Frontend Dependencies:
```bash
cd client
npm install
```

#### Install Backend Dependencies:
```bash
cd ../server
npm install
```

#### Create `.env` file:
In the `server` directory, create a `.env` file and add your environment variables:
```env
MONGO_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
PORT=5000
```

---

## ▶️ Running the Application

### Start the Backend Server:
From the `server` directory, run:
```bash
npm start
```
The server will start on **http://localhost:5000**.

### Start the Frontend Development Server:
In a new terminal, from the `client` directory, run:
```bash
npm start
```
The React application will open in your browser at **http://localhost:3000**.

---

## ⚠️ Disclaimer

This tool is for informational and educational purposes only. It is **not a substitute** for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for any health concerns.
