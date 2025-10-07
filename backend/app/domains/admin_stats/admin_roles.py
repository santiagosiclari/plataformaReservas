from datetime import datetime
import os
import enum
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.core.deps import get_db, get_current_user, require_admin
from app.core.db import Base
from app.domains.users.models import User
from sqlalchemy import Column, Integer, Enum as SAEnum, DateTime, ForeignKey, String
from app.utils.email_smtp import send_basic_html_email, send_basic_html_email_safe
from app.utils.email_templates import (
    role_request_html,
    role_request_approved_html,
    role_request_rejected_html,
)
from app.shared.enums import RoleEnum, RoleRequestStatus

router = APIRouter(prefix="/admin/role-requests", tags=["admin-roles"])

class RoleRequest(Base):
    __tablename__ = "role_requests"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    role        = Column(SAEnum(RoleEnum), nullable=False)
    status      = Column(SAEnum(RoleRequestStatus), default=RoleRequestStatus.pending, nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

# ---------- Helpers ----------
ADMIN_MAIL = os.getenv("ADMIN_EMAIL")
EMAIL_ENABLED = os.getenv("EMAIL_ENABLED", "true").lower() in ("1","true","yes")

# ---------- HELPERS ----------
def _ensure_no_pending(db: Session, user_id: int, role: str):
    existing = db.scalar(
        select(RoleRequest).where(
            RoleRequest.user_id == user_id,
            RoleRequest.role == RoleEnum(role),
            RoleRequest.status == RoleRequestStatus.pending
        )
    )
    if existing:
        raise HTTPException(409, "Ya existe una solicitud pendiente para ese rol")


def _build_urls(req_id: int) -> tuple[str, str]:
    from os import getenv
    base = getenv("PUBLIC_BASE_URL", "").rstrip("/")
    prefix = f"{base}/api/v1" if base else ""
    approve = f"{prefix}/admin/role-requests/{req_id}/approve"
    reject  = f"{prefix}/admin/role-requests/{req_id}/reject"
    return approve, reject

# ---------- ENDPOINTS ----------
@router.post("", status_code=200)
def create_role_request(body: dict, background: BackgroundTasks,
                        db: Session = Depends(get_db),
                        me: User = Depends(get_current_user)):
    role = (body.get("role") or "").upper()
    if role not in ("OWNER", "ADMIN"):
        raise HTTPException(400, "Rol inválido")
    if me.role in ("OWNER", "ADMIN"):
        raise HTTPException(400, "Ya tenés permisos elevados")

    # ⚠️ comparar con enums, no sólo strings
    existing = db.scalar(
        select(RoleRequest).where(
            RoleRequest.user_id == me.id,
            RoleRequest.role == RoleEnum(role),                   # enum
            RoleRequest.status == RoleRequestStatus.pending       # enum
        )
    )
    if existing:
        return {
            "id": existing.id,
            "user_id": existing.user_id,
            "role": existing.role.value if hasattr(existing.role, "value") else str(existing.role),
            "status": existing.status.value if hasattr(existing.status, "value") else str(existing.status),
            "created_at": existing.created_at,
            "resolved_at": existing.resolved_at,
            "reused": True
        }

    req = RoleRequest(user_id=me.id, role=RoleEnum(role), status=RoleRequestStatus.pending)
    db.add(req); db.commit(); db.refresh(req)

    approve_url, reject_url = _build_urls(req.id)
    html = role_request_html(
        admin_name="Santi",
        requester_name=me.name or "",
        requester_email=me.email,
        role=role,
        approve_url=approve_url,
        reject_url=reject_url,
    )

    if EMAIL_ENABLED and ADMIN_MAIL:
        background.add_task(
            send_basic_html_email_safe,
            ADMIN_MAIL,
            f"Solicitud de rol {role}",
            html,
        )
        print(f"[MAIL] ENQUEUED to {ADMIN_MAIL} (req_id={req.id}, role={role})")
    else:
        print("[INFO] Email deshabilitado o sin ADMIN_EMAIL; no se envía notificación")

    return {"id": req.id, "user_id": req.user_id, "role": role, "status": "pending", "created_at": req.created_at}


@router.get("/{req_id}/approve", dependencies=[Depends(require_admin)])
def approve_request(req_id: int, background: BackgroundTasks, db: Session = Depends(get_db)):
    req = db.get(RoleRequest, req_id)
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    if req.status != RoleRequestStatus.pending:
        raise HTTPException(status_code=400, detail="Solicitud ya procesada")

    user = db.get(User, req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # actualizar rol y marcar como aprobada
    user.role = req.role.value
    req.status = RoleRequestStatus.approved
    req.resolved_at = datetime.utcnow()
    db.commit()

    # notificar al usuario
    html_user = role_request_approved_html(user.name, req.role.value)
    background.add_task(
        send_basic_html_email,
        user.email,
        "Tu solicitud de rol fue aprobada ✔",
        html_user,
    )
    return {"detail": f"✅ Rol {req.role.value} asignado a {user.email}"}


@router.get("/{req_id}/reject", dependencies=[Depends(require_admin)])
def reject_request(req_id: int, background: BackgroundTasks, db: Session = Depends(get_db)):
    req = db.get(RoleRequest, req_id)
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    if req.status != RoleRequestStatus.pending:
        raise HTTPException(status_code=400, detail="Solicitud ya procesada")

    user = db.get(User, req.user_id)
    req.status = RoleRequestStatus.rejected
    req.resolved_at = datetime.utcnow()
    db.commit()

    # notificar rechazo
    if user:
        html_user = role_request_rejected_html(user.name, req.role.value)
        background.add_task(
            send_basic_html_email,
            user.email,
            "Tu solicitud de rol fue rechazada ❌",
            html_user,
        )
    return {"detail": "❌ Solicitud rechazada"}

@router.get("/mine")
def my_role_requests(db: Session = Depends(get_db),
                     me: User = Depends(get_current_user)):
    rows = db.scalars(
        select(RoleRequest).where(RoleRequest.user_id == me.id)
        .order_by(RoleRequest.created_at.desc())
    ).all()
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "role": r.role.value if hasattr(r.role, "value") else str(r.role),
            "status": r.status.value if hasattr(r.status, "value") else str(r.status),
            "created_at": r.created_at,
            "resolved_at": r.resolved_at,
        } for r in rows
    ]