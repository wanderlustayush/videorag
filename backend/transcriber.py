from faster_whisper import WhisperModel

model = WhisperModel("tiny", device="cpu", compute_type="int8")

def transcribe_video(video_path):
    print(f"Transcribing {video_path}...")
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
    from youtube_transcript_api import YouTubeTranscriptApi
    print(f"Fetching transcript for YouTube video {video_id}...")
    transcript = YouTubeTranscriptApi.get_transcript(video_id)
    result = []
    for entry in transcript:
        result.append({
            "start": entry["start"],
            "end": entry["start"] + entry["duration"],
            "text": entry["text"].strip()
        })
    print(f"Done! Got {len(result)} segments.")
    return result