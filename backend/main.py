import os
import uuid
import yt_dlp
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transcriber import transcribe_video
from chunker import chunk_segments
from embedder import store_chunks
from retriever import retrieve_chunks
from llm import get_answer

# Create required folders on startup
os.makedirs("uploads", exist_ok=True)
os.makedirs("data", exist_ok=True)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class URLRequest(BaseModel):
    url: str

class AskRequest(BaseModel):
    query: str
    video_id: str

@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    video_id = str(uuid.uuid4())[:8]
    video_path = f"uploads/{video_id}_{file.filename}"
    with open(video_path, "wb") as f:
        f.write(await file.read())
    segments = transcribe_video(video_path)
    chunks = chunk_segments(segments)
    store_chunks(chunks, video_id)
    return {"video_id": video_id, "message": "Video processed successfully!"}

@app.post("/upload-url")
async def upload_from_url(req: URLRequest):
    video_id = str(uuid.uuid4())[:8]
    video_path = f"uploads/{video_id}.mp4"
    ydl_opts = {
    "format": "best[ext=mp4]/best",
    "outtmpl": video_path,
    "quiet": True,
    "no_warnings": True,
    "extractor_args": {"youtube": {"skip": ["dash", "hls"]}},
    "http_headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    },
}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([req.url])
    segments = transcribe_video(video_path)
    chunks = chunk_segments(segments)
    store_chunks(chunks, video_id)
    return {"video_id": video_id, "video_path": video_path, "message": "Video downloaded and processed!"}

@app.post("/ask")
async def ask_question(req: AskRequest):
    chunks = retrieve_chunks(req.query, req.video_id)
    answer = get_answer(req.query, chunks)
    return {"answer": answer, "sources": chunks}

@app.get("/")
def home():
    return {"message": "Video RAG API is running!"}