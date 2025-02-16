from typing import Optional
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    username: str
    name: str
    surname: str
    age: int
    gender: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    role: str

    # Member-specific fields
    membership_status: Optional[str] = None


class Member(BaseModel):
    membership_status: Optional[str]


class UserResponse(BaseModel):
    id: int
    username: str
    name: str
    surname: str
    age: int
    gender: str
    email: EmailStr
    phone: Optional[str]
    role: str
    member_details: Optional[Member] = None

    class Config:
        from_attributes = True

