"""
Vector database integration with Pinecone
"""
import os
from pinecone import Pinecone, ServerlessSpec
from typing import List, Dict, Optional
import hashlib

# Initialize Pinecone
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT", "us-east-1")
INDEX_NAME = "legal-ai-documents"

pc = None
index = None

def init_pinecone():
    """Initialize Pinecone client and index"""
    global pc, index
    
    if not PINECONE_API_KEY:
        print("[VECTOR] Warning: PINECONE_API_KEY not set, vector search disabled")
        return False
    
    try:
        pc = Pinecone(api_key=PINECONE_API_KEY)
        
        # Create index if it doesn't exist
        existing_indexes = [idx.name for idx in pc.list_indexes()]
        
        if INDEX_NAME not in existing_indexes:
            pc.create_index(
                name=INDEX_NAME,
                dimension=1536,  # text-embedding-3-small dimension
                metric='cosine',
                spec=ServerlessSpec(
                    cloud='aws',
                    region=PINECONE_ENVIRONMENT
                )
            )
            print(f"[VECTOR] Created Pinecone index: {INDEX_NAME}")
        
        index = pc.Index(INDEX_NAME)
        print(f"[VECTOR] Connected to Pinecone index: {INDEX_NAME}")
        return True
        
    except Exception as e:
        print(f"[VECTOR] Error initializing Pinecone: {e}")
        return False

def generate_vector_id(doc_id: str, chunk_index: int) -> str:
    """Generate unique vector ID"""
    return f"{doc_id}_chunk_{chunk_index}"

def upsert_document_vectors(doc_id: str, firm_id: str, chunks: List[str], 
                           embeddings: List[List[float]], metadata: Dict = None) -> bool:
    """Store document chunk embeddings in Pinecone"""
    if not index:
        return False
    
    try:
        vectors = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            vector_id = generate_vector_id(doc_id, i)
            
            vector_metadata = {
                "doc_id": doc_id,
                "firm_id": firm_id,
                "chunk_index": i,
                "text": chunk[:1000],  # Store first 1000 chars of chunk
                **(metadata or {})
            }
            
            vectors.append({
                "id": vector_id,
                "values": embedding,
                "metadata": vector_metadata
            })
        
        # Upsert in batches of 100
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            index.upsert(vectors=batch)
        
        print(f"[VECTOR] Upserted {len(vectors)} vectors for document {doc_id}")
        return True
        
    except Exception as e:
        print(f"[VECTOR] Error upserting vectors: {e}")
        return False

def search_similar_chunks(query_embedding: List[float], firm_id: str, 
                         top_k: int = 5, doc_id: str = None) -> List[Dict]:
    """Search for similar document chunks"""
    if not index:
        return []
    
    try:
        # Build filter
        filter_dict = {"firm_id": firm_id}
        if doc_id:
            filter_dict["doc_id"] = doc_id
        
        # Query Pinecone
        results = index.query(
            vector=query_embedding,
            filter=filter_dict,
            top_k=top_k,
            include_metadata=True
        )
        
        # Format results
        chunks = []
        for match in results.matches:
            chunks.append({
                "doc_id": match.metadata.get("doc_id"),
                "chunk_index": match.metadata.get("chunk_index"),
                "text": match.metadata.get("text"),
                "score": match.score,
                "metadata": match.metadata
            })
        
        return chunks
        
    except Exception as e:
        print(f"[VECTOR] Error searching vectors: {e}")
        return []

def delete_document_vectors(doc_id: str) -> bool:
    """Delete all vectors for a document"""
    if not index:
        return False
    
    try:
        # Query to get all vector IDs for this document
        results = index.query(
            vector=[0.0] * 1536,  # Dummy vector
            filter={"doc_id": doc_id},
            top_k=10000,
            include_metadata=False
        )
        
        vector_ids = [match.id for match in results.matches]
        
        if vector_ids:
            index.delete(ids=vector_ids)
            print(f"[VECTOR] Deleted {len(vector_ids)} vectors for document {doc_id}")
        
        return True
        
    except Exception as e:
        print(f"[VECTOR] Error deleting vectors: {e}")
        return False

def get_stats() -> Dict:
    """Get index statistics"""
    if not index:
        return {"status": "disabled"}
    
    try:
        stats = index.describe_index_stats()
        return {
            "status": "active",
            "total_vectors": stats.total_vector_count,
            "dimension": stats.dimension,
            "index_fullness": stats.index_fullness
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

# Initialize on import
init_pinecone()
