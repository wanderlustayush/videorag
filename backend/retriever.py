import chromadb

client = chromadb.PersistentClient(path="./data")

def retrieve_chunks(query, video_id, top_k=3):
    collection = client.get_or_create_collection(name=video_id)
    results = collection.query(query_texts=[query], n_results=top_k)
    chunks = []
    for i in range(len(results["documents"][0])):
        chunks.append({
            "text": results["documents"][0][i],
            "start": results["metadatas"][0][i]["start"],
            "end": results["metadatas"][0][i]["end"]
        })
    return chunks