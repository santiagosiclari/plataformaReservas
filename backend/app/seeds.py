from sqlalchemy.orm import Session
from datetime import time
from app.models.user import User
from app.models.venue import Venue
from app.models.court import Court
from app.models.schedule import CourtSchedule
from app.models.price import Price
from app.models.enums import SportEnum
from passlib.hash import bcrypt

def seed_minimo(db: Session):
    # Si ya hay algo, no duplica
    if db.query(User).count() > 0:
        return

    owner = User(
        name="Club Owner",
        email="owner@club.com",
        password_hash=bcrypt.hash("owner123"),
        phone="11-1111-1111",
    )
    db.add(owner); db.flush()

    venue = Venue(
        name="Club Palermo",
        address="Av. Siempre Viva 123",
        city="CABA",
        owner_user_id=owner.id
    )
    db.add(venue); db.flush()

    court1 = Court(venue_id=venue.id, sport=SportEnum.PADEL, surface="sintético", indoor=False, number="P1")
    court2 = Court(venue_id=venue.id, sport=SportEnum.PADEL, surface="sintético", indoor=True, number="P2")
    db.add_all([court1, court2]); db.flush()

    # Lunes a Domingo, 08:00–22:00, slots de 60’
    for d in range(7):
        db.add(CourtSchedule(court_id=court1.id, weekday=d, open_time=time(8,0), close_time=time(22,0), slot_minutes=60))
        db.add(CourtSchedule(court_id=court2.id, weekday=d, open_time=time(8,0), close_time=time(22,0), slot_minutes=60))

    # Precio general 08–18: $8000, 18–22: $10000 (ejemplo)
    for d in range(7):
        db.add(Price(court_id=court1.id, weekday=d, start_time=time(8,0), end_time=time(18,0),  price_per_slot=8000))
        db.add(Price(court_id=court1.id, weekday=d, start_time=time(18,0), end_time=time(22,0), price_per_slot=10000))
        db.add(Price(court_id=court2.id, weekday=d, start_time=time(8,0), end_time=time(18,0),  price_per_slot=9000))
        db.add(Price(court_id=court2.id, weekday=d, start_time=time(18,0), end_time=time(22,0), price_per_slot=11000))

    db.commit()
