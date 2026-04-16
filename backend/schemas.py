from typing import Optional, Union
from pydantic import BaseModel, EmailStr, field_validator, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from datetime import date, time

class UserCreate(BaseModel):
    username: str
    name: str
    surname: str
    email: EmailStr
    phone: Optional[str] = None
    password: str | None = None
    age: int | None = None
    gender: str | None = None
    role: str
    avatar: Optional[str] = None

    # Member-specific fields
    membership_status: Optional[str] = None
    # Driver-specific fields
    license_number: Optional[str] = None
    salary_rate: Optional[float] = None


class Member(BaseModel):
    membership_status: Optional[str]

class Company(BaseModel):
    name: str
    domain: str
    industry: str

class DriverDetails(BaseModel):
    license_number: Optional[str]
    salary_rate: Optional[float]
    hired_at: Optional[date]

class DriverResponse(BaseModel):
    id: int
    name: str
    surname: str
    email: str
    phone: str
    license_number: Optional[str]
    salary_rate: Optional[float]
    hired_at: Optional[date]

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    username: str
    name: str
    surname: str
    email: EmailStr
    phone: Optional[str]
    role: str
    age: Optional[int] = None
    gender: Optional[str] = None
    member_details: Optional[Member] = None
    company: Optional[Company] = None
    driver_details: Optional[DriverDetails] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    name: Optional[str] = None
    surname: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None


class DriverUpdate(BaseModel):
    phone: Optional[str] = None
    license_number: Optional[str] = None
    salary_rate: Optional[float] = None

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


class DriverLicenseUploadResponse(BaseModel):
    id: int
    status: str
    image_url: str

    class Config:
        from_attributes = True


class DriverLicenseVerificationResponse(BaseModel):
    id: int
    user_id: int
    image_url: str
    extracted_name: Optional[str]
    extracted_surname: Optional[str]
    extracted_birthdate: Optional[date]
    extracted_license_number: Optional[str]
    extracted_expiry: Optional[date]
    risk_score: Optional[float]
    status: str
    admin_comment: Optional[str]

    class Config:
        from_attributes = True


class AdminReviewRequest(BaseModel):
    status: str
    admin_comment: Optional[str] = None

class LicenseSubmissionResponse(BaseModel):
    id: int
    status: str
    risk_score: Optional[float] = None
    risk_reason: Optional[str] = None
    validation_flags: Optional[List[str]] = None
    extracted_data: Optional[Dict[str, Any]] = None
    profile_matches: Optional[Dict[str, bool]] = None
    admin_note: Optional[str] = None
    submitted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class LicenseAdminResponse(LicenseSubmissionResponse):
    driver_name: Optional[str] = None
    image_url: Optional[str] = None
    reviewed_at: Optional[datetime] = None

class LicenseReviewRequest(BaseModel):
    decision: str   # "approved" | "rejected" | "manual_review"
    admin_note: Optional[str] = None


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
    tags: List[str] # List of tags associated with the post
    from_country: Optional[str] = None
    from_city: Optional[str] = None
    to_country: Optional[str] = None
    to_city: Optional[str] = None
    distance_km: Optional[float] = None
    estimated_duration: Optional[int] = None
    price: Optional[float] = None


# Post response model (used for reading post data, includes author and comments)
class Post(BaseModel):
    id: int
    title: str
    tags: List[str]
    created_at: datetime
    user_id: int
    from_country: Optional[str] = None
    from_city: Optional[str] = None
    to_country: Optional[str] = None
    to_city: Optional[str] = None
    distance_km: Optional[float] = None
    estimated_duration: Optional[int] = None
    price: Optional[float] = None
    comments: List["Comment"] = []  # List of related comments
    images: List["Image"] = []
    user: Optional[UserResponse]


    class Config:
        from_attributes = True

# Event creation model
class EventCreate(BaseModel):
    name: str
    post_id: int
    description: Optional[str] = None
    date: date
    time: time  # Date and time of the event
    duration: int  # Duration in hours
    event_type: str  # 'private' or 'public'
    is_personal_training: Optional[bool] = False  # True if personal training
    max_participants: Optional[int] = None  # For group classes
    room_number: Optional[str] = None  # For group classes
    trainer_id: Optional[int] = None  # Trainer assigned for personal training (public only)
    driver_id: Optional[int] = None

    @field_validator('duration')
    def duration_must_be_greater_than_15(cls, value):
        if value <= 0:
            raise ValueError('Duration must be greater than 0 hour')
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
    driver_id: Optional[int] = None
    creator_id: int  # User ID who created the event
    trainer_id: Optional[int] = None  # Trainer assigned for personal training
    participants: List[UserResponse] = []  # List of participants (for public group events)
    post: Post
    bookings_count: int = 0

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




# Booking creation model
class BookingCreate(BaseModel):
    seat_number: int


# Booking response model
class Booking(BaseModel):
    id: int
    user_id: int
    event_id: int
    seat_number: int | None
    qr_code: str | None
    user: UserResponse | None = None
    event: Event | None = None

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

# Update the Initiative schema in schemas.py
class InitiativeBase(BaseModel):
    title: str
    description: str
    month: int
    year: int


class InitiativeCreate(InitiativeBase):
    pass


class Initiative(InitiativeBase):
    id: int
    created_by: int
    created_at: datetime
    status: str
    company_id: int
    vote_count: Optional[int] = None
    is_locked: Optional[bool] = False
    voting_end_date: Optional[datetime] = None
    auto_delete_date: Optional[datetime] = None

    class Config:
        from_attributes = True

# Vote schemas
class VoteCreate(BaseModel):
    initiative_id: int


class Vote(BaseModel):
    id: int
    user_id: int
    initiative_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Progress schemas
class ProgressBase(BaseModel):
    initiative_id: int
    progress: int  # 0-100 percentage
    completed: bool = False


class ProgressCreate(ProgressBase):
    initiative_id: int
    progress: int
    completed: bool
    details: Optional[Union[dict, str]] = None


class Progress(ProgressBase):
    id: int
    user_id: int
    updated_at: datetime
    details: Optional[Union[dict, str]] = None

    class Config:
        from_attributes = True

class DayOffRewardResponse(BaseModel):
    status: str  # "not_earned", "issued", "redeemed"
    qr_code: Optional[str]



class CarCreate(BaseModel):
    brand: str
    model: str
    year: int
    license_plate: str
    seats: int
    transmission: str   # "automatic" / "manual"
    fuel_type: str      # "petrol" / "diesel" / "electric"

    price_per_hour: float
    price_per_day: float
    price_per_km: float

    available: bool = True



class CarUpdate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    license_plate: Optional[str] = None
    seats: Optional[int] = None
    transmission: Optional[str] = None
    fuel_type: Optional[str] = None

    price_per_hour: Optional[float] = None
    price_per_day: Optional[float] = None
    price_per_km: Optional[float] = None

    available: Optional[bool] = None




class CarRentalCreate(BaseModel):
    car_id: int
    start_datetime: datetime
    end_datetime: datetime

    pickup_location: str
    dropoff_location: str

    kilometers_used: Optional[float] = None

    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None

    dropoff_lat: Optional[float] = None
    dropoff_lng: Optional[float] = None


class CarRentalUpdate(BaseModel):
    end_datetime: Optional[datetime] = None
    kilometers_used: Optional[float] = None
    status: Optional[str] = None

    dropoff_location: Optional[str] = None
    dropoff_lat: Optional[float] = None
    dropoff_lng: Optional[float] = None


class CarImageCreate(BaseModel):
    filename: str
    url: str

class CarImage(BaseModel):
    id: int
    url: str
    upload_date: datetime
    car_id: int

    class Config:
        from_attributes = True

class CarResponse(BaseModel):
    id: int
    brand: str
    model: str
    year: int
    license_plate: str
    seats: int
    transmission: str
    fuel_type: str

    price_per_hour: float
    price_per_day: float
    price_per_km: float

    available: bool
    current_location: Optional[str] = None
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None

    images: List[CarImage] = []

    class Config:
        from_attributes = True

class CarRentalResponse(BaseModel):
    id: int
    user_id: int
    car_id: int

    pickup_location: str
    dropoff_location: str

    pickup_lat: Optional[float]
    pickup_lng: Optional[float]

    dropoff_lat: Optional[float]
    dropoff_lng: Optional[float]

    start_datetime: datetime
    end_datetime: datetime

    kilometers_used: float
    total_price: float
    status: str
    created_at: datetime

    car: Optional[CarResponse] = None
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class CheckoutRequest(BaseModel):
    amount: float
    type: str

class BookingSeatRequest(BaseModel):
    seat_number: int

    class Config:
        orm_mode = True