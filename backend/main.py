import os
import re
import uuid
import yt_dlp
from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transcriber import transcribe_video, transcribe_youtube
from chunker import chunk_segments
from embedder import store_chunks
from retriever import retrieve_chunks
from llm import get_answer

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

jobs = {}

class URLRequest(BaseModel):
    url: str

class AskRequest(BaseModel):
    query: str
    video_id: str

def extract_youtube_id(url: str):
    match = re.search(r"(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)", url)
    return match.group(1) if match else None

def process_video(job_id: str, video_path: str):
    try:
        jobs[job_id] = {"status": "transcribing"}
        segments = transcribe_video(video_path)
        jobs[job_id] = {"status": "embedding"}
        chunks = chunk_segments(segments)
        store_chunks(chunks, job_id)
        jobs[job_id] = {"status": "done", "video_id": job_id}
    except Exception as e:
        jobs[job_id] = {"status": "error", "message": str(e)}

def process_url(job_id: str, url: str):
    try:
        yt_id = extract_youtube_id(url)
        if yt_id:
            jobs[job_id] = {"status": "transcribing"}
            segments = transcribe_youtube(yt_id)
        else:
            jobs[job_id] = {"status": "downloading"}
            video_path = f"uploads/{job_id}.mp4"
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
                ydl.download([url])
            jobs[job_id] = {"status": "transcribing"}
            segments = transcribe_video(video_path)

        jobs[job_id] = {"status": "embedding"}
        chunks = chunk_segments(segments)
        store_chunks(chunks, job_id)
        jobs[job_id] = {"status": "done", "video_id": job_id}
    except Exception as e:
        jobs[job_id] = {"status": "error", "message": str(e)}

@app.post("/upload")
async def upload_video(file: UploadFile = File(...), background_tasks: BackgroundTasks = BackgroundTasks()):
    job_id = str(uuid.uuid4())[:8]
    video_path = f"uploads/{job_id}_{file.filename}"
    with open(video_path, "wb") as f:
        f.write(await file.read())
    jobs[job_id] = {"status": "queued"}
    background_tasks.add_task(process_video, job_id, video_path)
    return {"job_id": job_id}

@app.post("/upload-url")
async def upload_from_url(req: URLRequest, background_tasks: BackgroundTasks = BackgroundTasks()):
    job_id = str(uuid.uuid4())[:8]
    jobs[job_id] = {"status": "queued"}
    background_tasks.add_task(process_url, job_id, req.url)
    return {"job_id": job_id}

@app.get("/status/{job_id}")
def get_status(job_id: str):
    return jobs.get(job_id, {"status": "not_found"})

@app.post("/ask")
async def ask_question(req: AskRequest):
    chunks = retrieve_chunks(req.query, req.video_id)
    answer = get_answer(req.query, chunks)
    return {"answer": answer, "sources": chunks}

@app.get("/")
def home():
    return {"message": "Video RAG API is running!"}