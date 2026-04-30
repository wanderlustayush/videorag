import chromadb

client = chromadb.PersistentClient(path="./data")

def store_chunks(chunks, video_id):
    collection = client.get_or_create_collection(name=video_id)
    texts = [c["text"] for c in chunks]
    ids = [f"{video_id}_{i}" for i in range(len(chunks))]
    metadatas = [{"start": c["start"], "end": c["end"]} for c in chunks]
    collection.add(ids=ids, documents=texts, metadatas=metadatas)
    print(f"Stored {len(chunks)} chunks for {video_id}")