import datetime
from sqlalchemy import Column, String, DateTime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    username = Column(String, primary_key=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user") # 'admin' or 'user'
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
