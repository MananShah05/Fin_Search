from app.config import settings
import numpy as np


class EmbeddingService:
    def __init__(self):
        self._model = None
        self._dimension = settings.embedding_dimension

    def _load_model(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(settings.embedding_model)

    def encode(self, texts: list[str]) -> list[list[float]]:
        self._load_model()
        embeddings = self._model.encode(texts, show_progress_bar=False)
        if isinstance(embeddings, np.ndarray):
            return embeddings.tolist()
        return [e.tolist() for e in embeddings]

    def encode_query(self, query: str) -> list[float]:
        return self.encode([query])[0]

    @property
    def dimension(self) -> int:
        return self._dimension


embedding_service = EmbeddingService()