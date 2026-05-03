# 🎬 VideoRAG — AI-Powered Video Learning Platform

Ask anything about any YouTube video or uploaded file and get AI-powered answers with exact timestamp citations.

## 🌐 Live Demo
[videorag.vercel.app](https://videorag.vercel.app)

## ✨ Features
- 🔗 Paste any YouTube URL and ask questions about it
- 📁 Upload local video files (MP4, MOV, AVI up to 2GB)
- 🎯 Exact timestamp citations — click to jump to the exact moment in the video
- 💬 Full Q&A chat interface with conversation history
- 📚 Video history with saved conversations per user
- 🔐 Firebase authentication (Google + Email)

## 🚀 Tech Stack

### AI / ML
- **Whisper** (faster-whisper) — Speech-to-text transcription for uploaded videos
- **ChromaDB** — Vector database for semantic search and retrieval
- **Groq / Llama 3** — LLM for RAG-based question answering
- **RAG Pipeline** — Retrieval Augmented Generation architecture

### Backend
- **FastAPI** — REST API with background task processing
- **RapidAPI** — YouTube transcript fetching

### Frontend
- **React** — UI with real-time polling
- **Firebase** — Authentication (Google + Email)

### Deployment
- **Vercel** — Frontend
- **Render** — Backend

## 🏗️ Architecture

User pastes YouTube URL or uploads video file → FastAPI background task processes it → Whisper transcribes audio → ChromaDB stores embeddings → User asks question → ChromaDB retrieves relevant chunks → Groq LLM generates answer with timestamps
