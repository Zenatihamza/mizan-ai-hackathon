"""Chatbot with persistent per-user conversation history."""
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Conversation, Message
from app.schemas import (
    ConversationOut,
    ConversationDetail,
    MessageOut,
    SendMessageRequest,
    SendMessageResponse,
    ChatCitation,
)
from app.security import get_current_user
from app.services import chatbot

router = APIRouter()


def _msg_to_out(m: Message) -> MessageOut:
    cits = []
    if m.citations:
        try:
            cits = [ChatCitation(**c) for c in json.loads(m.citations)]
        except Exception:
            cits = []
    return MessageOut(
        id=m.id,
        role=m.role,
        content=m.content,
        content_ar=m.content_ar,
        citations=cits,
    )


@router.get("/conversations", response_model=List[ConversationOut])
def list_conversations(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    convs = (
        db.query(Conversation)
        .filter(Conversation.user_id == user.id)
        .order_by(Conversation.id.desc())
        .all()
    )
    return [ConversationOut(id=c.id, title=c.title) for c in convs]


@router.get("/conversations/{conv_id}", response_model=ConversationDetail)
def get_conversation(
    conv_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conv_id, Conversation.user_id == user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation introuvable")
    return ConversationDetail(
        id=conv.id,
        title=conv.title,
        messages=[_msg_to_out(m) for m in conv.messages],
    )


@router.delete("/conversations/{conv_id}")
def delete_conversation(
    conv_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conv_id, Conversation.user_id == user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation introuvable")
    db.delete(conv)
    db.commit()
    return {"ok": True}


@router.post("/message", response_model=SendMessageResponse)
def send_message(
    req: SendMessageRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    text = req.message.strip()
    if not text:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Message vide")

    # Find or create the conversation
    if req.conversation_id:
        conv = (
            db.query(Conversation)
            .filter(
                Conversation.id == req.conversation_id,
                Conversation.user_id == user.id,
            )
            .first()
        )
        if not conv:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation introuvable")
    else:
        conv = Conversation(user_id=user.id, title=chatbot.make_title(text))
        db.add(conv)
        db.flush()

    # Persist the user's message
    user_msg = Message(conversation_id=conv.id, role="user", content=text)
    db.add(user_msg)

    # Build history for context
    history = [{"role": m.role, "content": m.content} for m in conv.messages]
    history.append({"role": "user", "content": text})

    # Generate the assistant reply
    result = chatbot.answer(text, history)
    assistant_msg = Message(
        conversation_id=conv.id,
        role="assistant",
        content=result["content"],
        content_ar=result.get("content_ar"),
        citations=json.dumps(result.get("citations", []), ensure_ascii=False),
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return SendMessageResponse(
        conversation_id=conv.id,
        title=conv.title,
        reply=_msg_to_out(assistant_msg),
    )
