from fastapi import APIRouter, UploadFile, File, Form, Depends
from app.models.document import IngestResponse, IngestStatusResponse
from app.services.ingestion import ingestion_service
from app.core.auth import verify_admin

router = APIRouter()


@router.post("/ingest", response_model=IngestResponse)
async def ingest_pdf(
    file: UploadFile = File(...),
    doc_type: str = Form(default="other"),
    company: str = Form(default=""),
    date: str = Form(default=""),
    user: dict = Depends(verify_admin),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        return IngestResponse(
            job_id="",
            status="error",
            message="Only PDF files are supported",
        )

    content = await file.read()
    metadata = {
        "type": doc_type,
        "company": company,
        "date": date,
    }

    job_id = await ingestion_service.ingest_pdf(
        file_content=content,
        filename=file.filename,
        metadata=metadata,
    )

    return IngestResponse(
        job_id=job_id,
        status="processing",
        message="PDF ingestion started",
    )


@router.get("/ingest/status/{job_id}", response_model=IngestStatusResponse)
async def ingest_status(
    job_id: str,
    user: dict = Depends(verify_admin),
):
    status = ingestion_service.get_job_status(job_id)
    if status is None:
        return IngestStatusResponse(
            job_id=job_id,
            status="not_found",
            chunks_processed=0,
            chunks_total=0,
        )

    return IngestStatusResponse(
        job_id=job_id,
        status=status["status"],
        chunks_processed=status["chunks_processed"],
        chunks_total=status["chunks_total"],
    )