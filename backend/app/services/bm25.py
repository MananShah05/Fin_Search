import math
from collections import Counter
from typing import List, Dict, Tuple


class BM25Okapi:
    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.corpus: List[str] = []
        self.doc_ids: List[str] = []
        self.doc_freqs: List[Counter] = []
        self.idf: Dict[str, float] = {}
        self.avg_doc_len: float = 0.0
        self._built = False

    def _tokenize(self, text: str) -> List[str]:
        return text.lower().split()

    def build(self, corpus: List[str], doc_ids: List[str]):
        self.corpus = corpus
        self.doc_ids = doc_ids
        self.doc_freqs = [Counter(self._tokenize(doc)) for doc in corpus]

        total_terms = sum(sum(freqs.values()) for freqs in self.doc_freqs)
        n_docs = len(corpus)
        self.avg_doc_len = total_terms / n_docs if n_docs > 0 else 0.0

        df: Dict[str, int] = {}
        for freqs in self.doc_freqs:
            for term in freqs:
                df[term] = df.get(term, 0) + 1

        self.idf = {}
        for term, freq in df.items():
            self.idf[term] = math.log(1 + (n_docs - freq + 0.5) / (freq + 0.5))

        self._built = True

    def score(self, query: str, doc_idx: int) -> float:
        query_terms = self._tokenize(query)
        freqs = self.doc_freqs[doc_idx]
        doc_len = sum(freqs.values())

        score = 0.0
        for term in query_terms:
            if term not in self.idf:
                continue
            tf = freqs.get(term, 0)
            idf = self.idf[term]
            numerator = tf * (self.k1 + 1)
            denominator = tf + self.k1 * (1 - self.b + self.b * doc_len / self.avg_doc_len)
            score += idf * (numerator / denominator)

        return score

    def search(self, query: str, top_k: int = 50) -> List[Tuple[str, float]]:
        if not self._built or not self.corpus:
            return []
        scored = [(self.doc_ids[i], self.score(query, i)) for i in range(len(self.corpus))]
        scored.sort(key=lambda x: x[1], reverse=True)
        return [(doc_id, score) for doc_id, score in scored[:top_k] if score > 0]

    def add_document(self, text: str, doc_id: str):
        self.corpus.append(text)
        self.doc_ids.append(doc_id)
        self._built = False

    def reset(self):
        self.corpus = []
        self.doc_ids = []
        self.doc_freqs = []
        self.idf = {}
        self.avg_doc_len = 0.0
        self._built = False


bm25_index = BM25Okapi()