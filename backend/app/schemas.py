"""Pydantic request/response schemas for auth and chat."""
from typing import List, Optional
from pydantic import BaseModel


# ---------- Auth ----------
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Chat ----------
class ChatCitation(BaseModel):
    code: str
    article: str
    excerpt: str


class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    content_ar: Optional[str] = None
    citations: List[ChatCitation] = []


class ConversationOut(BaseModel):
    id: int
    title: str


class ConversationDetail(BaseModel):
    id: int
    title: str
    messages: List[MessageOut]


class SendMessageRequest(BaseModel):
    conversation_id: Optional[int] = None
    message: str


class SendMessageResponse(BaseModel):
    conversation_id: int
    title: str
    reply: MessageOut
