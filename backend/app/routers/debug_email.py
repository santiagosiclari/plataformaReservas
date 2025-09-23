from fastapi import APIRouter, HTTPException, Query
from app.utils.email_smtp import send_html_email_gmail

router = APIRouter(prefix="/debug", tags=["debug"])

@router.post("/test-email")
def test_email(to: str = Query(..., description="Destino para probar")):
    try:
        send_html_email_gmail(
            to_email=to,
            subject="Prueba SMTP Gmail ✅",
            html="<h2>Funciona!</h2><p>Esto es una prueba desde FastAPI.</p>",
        )
        return {"ok": True, "to": to}
    except Exception as e:
        # logueá e si querés
        raise HTTPException(status_code=500, detail=f"Fallo enviando correo: {e}")
