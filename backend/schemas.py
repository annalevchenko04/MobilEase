from typing import Optional
from pydantic import BaseModel, EmailStr, Field

INDUSTRY_CHOICES = [
    "Technology", "Finance", "Healthcare", "Education",
    "Retail", "Manufacturing", "Real Estate", "Transportation",
    "Hospitality", "Energy"
]

class CompanyCreate(BaseModel):
    name: str
    industry: str = Field(..., description="Industry must be one of the predefined choices")
    domain: str

    @classmethod
    def validate_industry(cls, industry):
        if industry not in INDUSTRY_CHOICES:
            raise ValueError("Invalid industry choice.")
        return industry


class CompanyResponse(CompanyCreate):
    id: int

    class Config:
        from_attributes = True

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

