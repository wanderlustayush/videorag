def chunk_segments(segments, chunk_size=5):
    chunks = []
    
    for i in range(0, len(segments), chunk_size):
        group = segments[i:i + chunk_size]
        
        text = " ".join([s["text"] for s in group])
        start = group[0]["start"]
        end = group[-1]["end"]
        
        chunks.append({
            "text": text,
            "start": start,
            "end": end
        })
    
    return chunks