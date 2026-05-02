import os
import requests

def transcribe_video(video_path):
    from faster_whisper import WhisperModel
    print(f"Transcribing {video_path}...")
    model = WhisperModel("tiny", device="cpu", compute_type="int8")
    segments, _ = model.transcribe(video_path)
    result = []
    for seg in segments:
        result.append({
            "start": seg.start,
            "end": seg.end,
            "text": seg.text.strip()
        })
    print(f"Done! Got {len(result)} segments.")
    return result

def transcribe_youtube(video_id):
    print(f"Fetching transcript for YouTube video {video_id}...")
    api_key = os.getenv("RAPIDAPI_KEY")
    url = "https://youtube-transcript3.p.rapidapi.com/api/transcript"
    headers = {
        "x-rapidapi-key": api_key,
        "x-rapidapi-host": "youtube-transcript3.p.rapidapi.com",
        "Content-Type": "application/json"
    }
    params = {"videoId": video_id}
    response = requests.get(url, headers=headers, params=params)
    data = response.json()

    if not data.get("success") or "transcript" not in data:
        raise Exception(f"No transcript found: {data}")

    result = []
    for entry in data["transcript"]:
        start = float(entry.get("offset", 0))
        duration = float(entry.get("duration", 0))
        result.append({
            "start": start,
            "end": start + duration,
            "text": entry.get("text", "").strip()
        })
    print(f"Done! Got {len(result)} segments.")
    return result