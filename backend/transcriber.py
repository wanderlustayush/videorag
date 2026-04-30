import whisper

model = whisper.load_model("tiny")

def transcribe_video(video_path):
    print(f"Transcribing {video_path}...")
    
    result = model.transcribe(video_path)
    
    segments = []
    for seg in result["segments"]:
        segments.append({
            "start": seg["start"],
            "end": seg["end"],
            "text": seg["text"].strip()
        })
    
    print(f"Done! Got {len(segments)} segments.")
    return segments