from fastapi import APIRouter, Depends
from app.models.document import DocumentListResponse, DocumentResponse, CorpusStats
from app.models.user import QueryHistoryResponse, QueryHistoryItem, StarRequest
from app.services.ingestion import ingestion_service
from app.core.auth import verify_token
from app.core.database import get_firestore

router = APIRouter()


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(user: dict = Depends(verify_token)):
    db = get_firestore()
    docs = (
        db.collection("documents")
        .order_by("ingested_at", direction="DESCENDING")
        .stream()
    )

    documents = []
    for doc in docs:
        data = doc.to_dict()
        documents.append(DocumentResponse(
            id=doc.id,
            name=data.get("name", ""),
            type=data.get("type", "other"),
            company=data.get("company", ""),
            date=data.get("date", ""),
            chunk_count=data.get("chunk_count", 0),
            status=data.get("status", "unknown"),
            ingested_at=str(data.get("ingested_at")) if data.get("ingested_at") else None,
        ))

    return DocumentListResponse(documents=documents, total=len(documents))


@router.get("/documents/stats", response_model=CorpusStats)
async def corpus_stats(user: dict = Depends(verify_token)):
    stats = await ingestion_service.get_corpus_stats()
    return CorpusStats(**stats)


@router.get("/queries", response_model=QueryHistoryResponse)
async def query_history(user: dict = Depends(verify_token)):
    db = get_firestore()
    queries = (
        db.collection("users")
        .document(user["uid"])
        .collection("queries")
        .order_by("created_at", direction="DESCENDING")
        .limit(50)
        .stream()
    )

    items = []
    for q in queries:
        data = q.to_dict()
        items.append(QueryHistoryItem(
            id=q.id,
            text=data.get("text", ""),
            result_count=data.get("result_count", 0),
            top_result_doc=data.get("top_result_doc", ""),
            starred=data.get("starred", False),
            created_at=str(data.get("created_at")) if data.get("created_at") else "",
        ))

    return QueryHistoryResponse(queries=items)


@router.patch("/queries/{query_id}/star")
async def toggle_star(
    query_id: str,
    body: StarRequest,
    user: dict = Depends(verify_token),
):
    db = get_firestore()
    (
            db.collection("users")
        .document(user["uid"])
        .collection("queries")
        .document(query_id)
        .update({"starred": body.starred})
    )
    return {"status": "ok"}


@router.get("/documents/{id_or_name}/pdf")
async def get_pdf_file(id_or_name: str):
    from fastapi import Response, HTTPException
    db = get_firestore()
    
    # 1. Try to find by doc_id directly
    doc_ref = db.collection("documents").document(id_or_name)
    doc_snap = doc_ref.get()
    
    if doc_snap.exists:
        doc_id = doc_snap.id
        doc_name = doc_snap.to_dict().get("name")
    else:
        # 2. Try to find by name field
        docs = db.collection("documents").where("name", "==", id_or_name).limit(1).stream()
        found_doc = None
        for d in docs:
            found_doc = d
            break
        if not found_doc:
            raise HTTPException(status_code=404, detail="Document not found")
        doc_id = found_doc.id
        doc_name = found_doc.to_dict().get("name")
        
    # Download the file content from storage
    from app.core.storage import get_storage
    try:
        storage_client = get_storage()
        file_bytes = storage_client.download(doc_id, doc_name)
        return Response(content=file_bytes, media_type="application/pdf")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="PDF file not found in storage")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve PDF: {str(e)}")