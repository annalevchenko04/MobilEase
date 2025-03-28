from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator, Field
from typing import List, Optional, Dict
from datetime import datetime
from datetime import date, time

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
    avatar: Optional[str] = None

    # Member-specific fields
    membership_status: Optional[str] = None


class Member(BaseModel):
    membership_status: Optional[str]

class Company(BaseModel):
    name: str
    domain: str
    industry: str


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
    company: Optional[Company] = None

    class Config:
        from_attributes = True




# Image creation model (used for uploading an image)
class AvatarCreate(BaseModel):
    filename: str  # Original filename
    url: str


# Image response model (used for reading image data)
class Avatar(BaseModel):
    id: int
    url: str
    upload_date: datetime
    user_id: int
    user: Optional[UserResponse]


    class Config:
        from_attributes = True


class Question(BaseModel):
    id: str
    text: str
    unit: str
    type: str  # "range", "single_value", "dropdown", etc.
    options: Optional[List[str]] = None
    default_value: Optional[float] = None

class CarbonFootprintRequest(BaseModel):
    answers: Dict[str, str | float]




# Post creation model (used for creating a post)
class PostCreate(BaseModel):
    title: str
    content: str
    category: str  # e.g., 'news', 'blog', 'announcement'
    tags: List[str] # List of tags associated with the post

# Post response model (used for reading post data, includes author and comments)
class Post(BaseModel):
    id: int
    title: str
    content: str
    category: str
    tags: List[str]
    status: str  # e.g., 'published', 'draft'
    created_at: datetime
    user_id: int
    comments: List["Comment"] = []  # List of related comments
    images: List["Image"] = []
    user: Optional[UserResponse]

    class Config:
        from_attributes = True


class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    post_id: int
    user_id: int

class Comment(CommentBase):
    id: int
    created_at: datetime
    post_id: int
    user_id: int
    user: Optional[UserResponse]

    class Config:
        from_attributes = True  # Ensures compatibility with SQLAlchemy models

# Image creation model (used for uploading an image)
class ImageCreate(BaseModel):
    filename: str  # Original filename
    url: str


# Image response model (used for reading image data)
class Image(BaseModel):
    id: int
    url: str
    upload_date: datetime
    post_id: int


    class Config:
        from_attributes = True

# To avoid circular imports, declare images field after Image schema
Post.update_forward_refs()

class Favorite(BaseModel):
    id: int  # Unique identifier for the favorite entry
    user_id: int  # The ID of the user who favorited the property
    post_id: int  # The ID of the favorited property

    class Config:
        from_attributes = True



class BadgeResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class UserBadgeResponse(BaseModel):
    id: int
    badge: Optional[BadgeResponse] = None  # Include badge details

    class Config:
        from_attributes = True





# Event creation model
class EventCreate(BaseModel):
    name: str
    description: Optional[str] = None
    date: date
    time: time  # Date and time of the event
    duration: int  # Duration in minutes
    event_type: str  # 'private' or 'public'
    is_personal_training: Optional[bool] = False  # True if personal training
    max_participants: Optional[int] = None  # For group classes
    room_number: Optional[str] = None  # For group classes
    trainer_id: Optional[int] = None  # Trainer assigned for personal training (public only)

    @field_validator('duration')
    def duration_must_be_greater_than_15(cls, value):
        if value <= 15:
            raise ValueError('Duration must be greater than 15 minutes')
        return value

    @field_validator('max_participants')
    def max_participants_must_be_greater_than_0(cls, value):
        if value <= 0:
            raise ValueError('Max participants value must be greater than 0')
        return value

    class Config:
        from_attributes = True


# Event response model
class Event(BaseModel):
    id: int
    name: str
    description: Optional[str]
    date: date
    time: time  # Date and time of the event
    duration: int
    event_type: str  # 'private' or 'public'
    is_personal_training: bool  # True if personal training
    max_participants: Optional[int] = None  # For group classes
    room_number: Optional[str] = None  # For group classes
    creator_id: int  # User ID who created the event
    trainer_id: Optional[int] = None  # Trainer assigned for personal training
    participants: List[UserResponse] = []  # List of participants (for public group events)

    class Config:
        from_attributes = True


# Booking creation model
class BookingCreate(BaseModel):
    event_id: int


# Booking response model
class Booking(BaseModel):
    id: int
    user_id: int
    event_id: int
    user: UserResponse  # Include details about the user booking the event
    event: Event  # Include details about the event being booked

    class Config:
        from_attributes = True



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