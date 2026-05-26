from typing import List, Tuple


def sentence_aware_chunk(
    text: str,
    chunk_size: int = 512,
    overlap: int = 64,
) -> List[Tuple[str, int]]:
    import re

    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    chunks: List[Tuple[str, int]] = []
    current_chunk: List[str] = []
    current_length = 0
    start_page = 1

    for sentence in sentences:
        word_count = len(sentence.split())
        if current_length + word_count > chunk_size and current_chunk:
            chunk_text = " ".join(current_chunk)
            chunks.append((chunk_text, start_page))
            overlap_words = []
            overlap_len = 0
            for s in reversed(current_chunk):
                sw = len(s.split())
                if overlap_len + sw > overlap:
                    break
                overlap_words.insert(0, s)
                overlap_len += sw
            current_chunk = overlap_words
            current_length = overlap_len
            start_page += 1

        current_chunk.append(sentence)
        current_length += word_count

    if current_chunk:
        chunk_text = " ".join(current_chunk)
        chunks.append((chunk_text, start_page))

    return chunks