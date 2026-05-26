from pydantic import BaseModel


class UserResponse(BaseModel):
    uid: str
    email: str
    role: str = "analyst"


class AuthVerifyRequest(BaseModel):
    id_token: str


class AuthVerifyResponse(BaseModel):
    uid: str
    email: str
    role: str


class QueryHistoryItem(BaseModel):
    id: str
    text: str
    result_count: int
    top_result_doc: str = ""
    starred: bool = False
    created_at: str


class QueryHistoryResponse(BaseModel):
    queries: list[QueryHistoryItem]


class StarRequest(BaseModel):
    starred: bool