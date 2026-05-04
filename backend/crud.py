from typing import Any

from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload, selectinload
from . import models
from . import schemas
from pydantic import json
from passlib.context import CryptContext
from backend.redis_client import redis_client
from sqlalchemy.exc import IntegrityError
import json
import logging
from typing import Optional, List
from qrcode import QRCode
from datetime import datetime, timedelta, timezone, date
import base64
from io import BytesIO
from sendgrid.helpers.mail import (
    Mail, Attachment, FileContent,
    FileName, FileType, Disposition
)
from .models import Booking, Event

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

import os
from pathlib import Path
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from dotenv import load_dotenv

load_dotenv()

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDER_EMAIL = "annlev@ktu.lt"  # Your verified SendGrid sender email

# Dynamically get the absolute path to the email template
BASE_DIR = Path(__file__).resolve().parent
EMAIL_TEMPLATE_PATH = BASE_DIR / "email_template.html"
BOOKING_TEMPLATE_PATH = BASE_DIR / "booking_confirmation.html"

def send_welcome_email(to_email: str, name: str):
    try:
        with open(EMAIL_TEMPLATE_PATH, "r", encoding="utf-8") as f:
            html_content = f.read().replace("{name}", name)

        message = Mail(
            from_email=SENDER_EMAIL,
            to_emails=to_email,
            subject="Welcome to the MobilEase!",
            html_content=html_content
        )

        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"✅ Email sent to {to_email}. Status code: {response.status_code}")

    except Exception as e:
        print("❌ Email sending failed:", e)
        raise e


def create_user(db: Session, user: schemas.UserCreate):
    # ── Handle password hashing safely ──────────────────────
    is_google_user = user.password is None or user.password == "google_oauth"
    hashed_password = pwd_context.hash(user.password) if not is_google_user else "google_oauth"

    # ── Uniqueness checks ────────────────────────────────────
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already taken.")
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered.")
    if user.phone and db.query(models.User).filter(models.User.phone == user.phone).first():
        raise HTTPException(status_code=400, detail="Phone number already registered.")

    user_data = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password,
        "name": user.name,
        "surname": user.surname,
        "age": user.age,
        "gender": user.gender,
        "phone": user.phone,
        "role": user.role,
    }

    if user.role == "member":
        db_user = models.Member(**user_data, membership_status=user.membership_status or "active")

    elif user.role == "admin":
        db_user = models.Admin(**user_data)

    elif user.role == "driver":
        if not user.email.endswith("@mobilease.com"):
            raise HTTPException(
                status_code=400,
                detail="Driver accounts must use @mobilease.com email."
            )
        db_user = models.Driver(
            **user_data,
            license_number=user.license_number,
            salary_rate=user.salary_rate
        )
    else:
        raise ValueError("Invalid role specified")

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # ── Send welcome email — non-blocking ───────────────────
    try:
        send_welcome_email(db_user.email, db_user.name)
    except Exception as e:
        print(f"⚠️ Welcome email failed (non-critical): {e}")

    return schemas.UserResponse.model_validate({
        "id": db_user.id,
        "username": db_user.username,
        "name": db_user.name,
        "surname": db_user.surname,
        "age": db_user.age,
        "gender": db_user.gender,
        "email": db_user.email,
        "phone": db_user.phone,
        "role": db_user.role,
        "member_details": {
            "membership_status": db_user.membership_status
        } if isinstance(db_user, models.Member) else None,
        "company": None
    })

def create_company(db: Session, company_data: schemas.CompanyCreate, user_data: schemas.UserCreate):
    # 🔹 Check if company already exists
    existing_company = db.query(models.Company).filter(models.Company.name == company_data.name).first()
    if existing_company:
        raise HTTPException(status_code=400, detail="Company with this name already exists.")

    # 🔹 Check if username already exists before creating company
    existing_user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username is already taken.")

    # 🔹 Hash the password
    hashed_password = pwd_context.hash(user_data.password)

    try:
        # 🔹 Create company entry
        new_company = models.Company(
            name=company_data.name,
            industry=company_data.industry,
            domain=company_data.domain,
        )
        db.add(new_company)
        db.commit()
        db.refresh(new_company)

        # 🔹 Create user as company admin
        new_admin = models.Admin(
            username=user_data.username,
            name=user_data.name,
            surname=user_data.surname,
            age=user_data.age,
            gender=user_data.gender,
            email=user_data.email,
            phone=user_data.phone,
            hashed_password=hashed_password,
            role="admin",
            company_id=new_company.id,
        )

        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)

        # Send email after successful registration
        #send_company_registration_email(new_company.name, new_admin.email)

        return new_admin

    except IntegrityError as e:
        db.rollback()  # Rollback company creation if admin creation fails
        raise HTTPException(status_code=400, detail="An error occurred while creating the company admin. Username might already be taken.")

    except Exception as e:
        db.rollback()  # Ensure rollback on any unexpected error
        raise HTTPException(status_code=500, detail="Unexpected server error occurred.")


def get_user(db: Session, username: str):
    db_user = db.query(models.User).filter(models.User.username == username).first()
    if not db_user:
        return None

    user_data = {
        "id": db_user.id,
        "username": db_user.username,
        "hashed_password": db_user.hashed_password,
        "name": db_user.name,
        "surname": db_user.surname,
        "age": db_user.age,
        "gender": db_user.gender,
        "email": db_user.email,
        "phone": db_user.phone,
        "role": db_user.role,
    }

    member_details = None
    if db_user.role == "member":
        member_data = db.query(models.Member).filter(models.Member.username == username).first()
        if member_data:  # ← add this None check
            member_details = schemas.Member(
                membership_status=member_data.membership_status,
            )

    return schemas.UserResponse(
        **user_data,
        member_details=member_details
    )


def get_user_by_id(db: Session, userid: int):

    db_user = db.query(models.User).filter(models.User.id == userid).first()
    if not db_user:
        return None
    user_data = {
        "id": db_user.id,
        "username": db_user.username,
        "hashed_password": db_user.hashed_password,
        "name": db_user.name,
        "surname": db_user.surname,
        "age": db_user.age,
        "gender": db_user.gender,
        "email": db_user.email,
        "phone": db_user.phone,
        "role": db_user.role,
    }

    member_details = None
    if db_user.role == "member":
        member_data = db.query(models.Member).filter(models.Member.id == userid).first()
        member_details = schemas.Member(
            membership_status=member_data.membership_status,
        )

    return schemas.UserResponse(
        **user_data,
        member_details=member_details
    )


def get_user_id(db: Session, username: str) -> Any | None:
    db_user = db.query(models.User).filter(models.User.username == username).first()
    if db_user:
        return db_user.id
    return None


def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        return None

    # Update only provided fields
    update_data = user_update.dict(exclude_unset=True)

    # Handle password separately
    if "password" in update_data:
        db_user.hashed_password = pwd_context.hash(update_data["password"])
        del update_data["password"]

    # Update other fields
    for field, value in update_data.items():
        setattr(db_user, field, value)

    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()

    if not db_user:
        return None

    db.delete(db_user)
    db.commit()
    return True


def get_users(db: Session):
    users = db.query(models.User).all()

    if not users:
        return []

    user_responses = []
    for user in users:
        if isinstance(user, models.Member):
            user_response = schemas.UserResponse.model_validate(
                {
                    "id": user.id,
                    "username": user.username,
                    "name": user.name,
                    "surname": user.surname,
                    "age": user.age,
                    "gender": user.gender,
                    "email": user.email,
                    "phone": user.phone,
                    "role": user.role,
                    "member_details": {
                        "membership_status": user.membership_status,
                    },
                }
            )
        elif isinstance(user, models.Admin):
            user_response = schemas.UserResponse.model_validate(
                {
                    "id": user.id,
                    "username": user.username,
                    "name": user.name,
                    "surname": user.surname,
                    "age": user.age,
                    "gender": user.gender,
                    "email": user.email,
                    "phone": user.phone,
                    "role": user.role,
                }
            )
        else:
            raise ValueError(f"Unknown user role for user ID {user.id}")
        user_responses.append(user_response)
    return user_responses


def save_carbon_footprint(db: Session, user_id: int, total_footprint: float, details: dict, category_breakdown=None, season=None, year=None):
    if not user_id:
        raise ValueError("User ID is missing. Only authenticated users can submit their footprint.")

    combined_details = {
        "numeric_data": details["numeric_data"],
        "non_numeric_data": details["non_numeric_data"],
        "category_breakdown": category_breakdown or {}
    }

    logging.info(f"Saving Combined Details: {combined_details}")

    # If season and year are provided, check for existing entry to update
    if season and year:
        existing_entry = db.query(models.CarbonFootprint).filter(
            models.CarbonFootprint.user_id == user_id,
            models.CarbonFootprint.season == season,
            models.CarbonFootprint.year == year
        ).first()

        if existing_entry:
            # Update existing entry
            existing_entry.total_footprint = total_footprint
            existing_entry.details = json.dumps(combined_details, default=str)
            db.commit()
            db.refresh(existing_entry)
            check_and_assign_climate_champion_badge(db, user_id, total_footprint, season, year)
            return existing_entry

    # Create new entry (for both seasonal and non-seasonal)
    footprint_entry = models.CarbonFootprint(
        user_id=user_id,
        total_footprint=total_footprint,
        details=json.dumps(combined_details, default=str),
        season=season,
        year=year
    )
    db.add(footprint_entry)
    db.commit()
    db.refresh(footprint_entry)
    check_and_assign_climate_champion_badge(db, user_id, total_footprint, season, year)
    return footprint_entry


# New function to get footprint history
def get_footprint_history(db: Session, user_id: int):
    """Get the carbon footprint history for a user, including seasonal entries."""
    if not user_id:
        raise ValueError("User ID is missing.")

    footprint_entries = db.query(models.CarbonFootprint).filter(
        models.CarbonFootprint.user_id == user_id
    ).order_by(
        models.CarbonFootprint.year.desc(),
        models.CarbonFootprint.season.desc(),
        models.CarbonFootprint.created_at.desc()
    ).all()

    return footprint_entries

# --- Post CRUD operations ---

def create_post(db: Session, post: schemas.PostCreate, user_id: int):
    db_post = models.Post(
        title=post.title,
        tags=post.tags,

        # Route fields
        from_country=post.from_country,
        from_city=post.from_city,
        to_country=post.to_country,
        to_city=post.to_city,
        distance_km=post.distance_km,
        estimated_duration=post.estimated_duration,
        price=post.price,

        # Associate with author
        user_id=user_id
    )

    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

def get_post(db: Session, post_id: int):
    return db.query(models.Post).filter(models.Post.id == post_id).first()


def get_posts_by_user(db: Session, user_id: int):
    return db.query(models.Post).filter(models.Post.user_id == user_id).all()


def get_all_posts(db: Session, skip: int = 0, limit: int = 10):
    return db.query(models.Post).offset(skip).limit(limit).all()



def update_post(db: Session, post_id: int, post_update: schemas.PostCreate):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()

    if not db_post:
        return None

    # Basic fields
    db_post.title = post_update.title
    db_post.tags = post_update.tags

    # Route fields
    db_post.from_country = post_update.from_country
    db_post.from_city = post_update.from_city
    db_post.to_country = post_update.to_country
    db_post.to_city = post_update.to_city
    db_post.distance_km = post_update.distance_km
    db_post.estimated_duration = post_update.estimated_duration
    db_post.price = post_update.price

    db.commit()
    db.refresh(db_post)
    return db_post


def delete_post(db: Session, post_id: int):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()

    if not db_post:
        return None

    db.delete(db_post)
    db.commit()
    return True

# --- Image CRUD operations ---

def create_image(db: Session, image: schemas.ImageCreate, post_id: int):
    """
    Create a new image associated with a specific post.
    """
    db_image = models.Image(
        url=image.url,
        post_id=post_id
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image


def get_image(db: Session, post_id: int, image_id: int):
    """
    Retrieve a single image by its ID and associated postid.
    """
    return db.query(models.Image).filter(
        models.Image.id == image_id,
        models.Image.post_id == post_id
    ).first()
def get_images_by_post(db: Session, post_id: int):
    """
    Retrieve all images associated with a specific post.
    """
    return db.query(models.Image).filter(models.Image.post_id == post_id).all()


def delete_image(db: Session, image_id: int):
    """
    Delete an image by its ID.
    """
    db_image = db.query(models.Image).filter(models.Image.id == image_id).first()

    if not db_image:
        return None

    db.delete(db_image)
    db.commit()
    return True


# --- Avatar CRUD operations ---

def create_avatar(db: Session, avatar: schemas.AvatarCreate, user_id: int):
    """
    Create a new image associated with a specific post.
    """
    db_avatar = models.Avatar(
        url=avatar.url,
        user_id=user_id
    )
    db.add(db_avatar)
    db.commit()
    db.refresh(db_avatar)
    return db_avatar


def get_avatar(db: Session, user_id: int):
    """
    Retrieve a single image by its ID and associated postid.
    """
    return db.query(models.Avatar).filter(
        models.Avatar.user_id == user_id
    ).first()

def delete_avatar(db: Session, avatar_id: int):
    """
    Delete an image by its ID.
    """
    db_avatar = db.query(models.Avatar).filter(models.Avatar.id == avatar_id).first()

    if not db_avatar:
        return None

    db.delete(db_avatar)
    db.commit()
    return True


# --- Favorite CRUD operations ---
def add_favorite(db: Session, user_id: int, post_id: int):
    favorite = models.Favorite(user_id=user_id, post_id=post_id)
    db.add(favorite)
    db.commit()
    db.refresh(favorite)

    check_and_assign_popular_post_badge(db, post_id)

    return favorite

def remove_favorite(db: Session, user_id: int, post_id: int):
    favorite = db.query(models.Favorite).filter_by(user_id=user_id, post_id=post_id).first()
    if favorite:
        db.delete(favorite)
        db.commit()
        check_and_assign_popular_post_badge(db, post_id)

        return True
    raise HTTPException(status_code=404, detail="Favorite not found")

def get_favorites(db: Session, user_id: int):
    return db.query(models.Post).join(models.Favorite).filter(models.Favorite.user_id == user_id).all()


# Count how many people favorited a post
def count_favorites(db: Session, post_id: int):
    return db.query(models.Favorite).filter(models.Favorite.post_id == post_id).count()


def check_and_assign_badge(db: Session, user_id: int):
    badge_name = "Green Ambassador"

    # Check the number of posts by the user
    post_count = db.query(models.Post).filter(models.Post.user_id == user_id).count()
    if post_count < 3:
        return  # No badge should be assigned yet

    # Get or create the badge
    existing_badge = db.query(models.Badge).filter(models.Badge.name == badge_name).first()
    if not existing_badge:
        existing_badge = models.Badge(name=badge_name, description="Awarded for posting 3 times")
        db.add(existing_badge)
        db.commit()  # Commit here to get the badge ID

    # Check if the user already has this badge
    user_has_badge = db.query(models.UserBadge).filter(
        models.UserBadge.user_id == user_id, models.UserBadge.badge_id == existing_badge.id
    ).first()

    if not user_has_badge:
        db.add(models.UserBadge(user_id=user_id, badge_id=existing_badge.id))
        db.commit()  # Commit only if assigning a new badge

    check_day_off_eligibility_and_issue(db, user_id)



def check_and_assign_popular_post_badge(db: Session, post_id: int):
    """
    This function checks if a post has 3 or more favorites and assigns the "Popular Post" badge if so.
    """
    popular_post_badge_name = "Trendsetter"
    favorite_count = count_favorites(db, post_id)

    if favorite_count >= 5:
        # Check if the "Popular Post" badge already exists
        existing_badge = db.query(models.Badge).filter(models.Badge.name == popular_post_badge_name).first()

        if not existing_badge:
            # Create the "Popular Post" badge if it doesn't exist
            existing_badge = models.Badge(
                name=popular_post_badge_name,
                description="Awarded for having 3+ likes on a post"
            )
            db.add(existing_badge)
            db.commit()  # Commit here to get the badge ID

        # Check if the post's user already has this badge
        post = db.query(models.Post).filter(models.Post.id == post_id).first()
        if post:
            user_id = post.user_id
            user_has_badge = db.query(models.UserBadge).filter(
                models.UserBadge.user_id == user_id, models.UserBadge.badge_id == existing_badge.id
            ).first()

            if not user_has_badge:
                # Assign the "Popular Post" badge to the user
                db.add(models.UserBadge(user_id=user_id, badge_id=existing_badge.id))
                db.commit()  # Commit only if assigning a new badge

            check_day_off_eligibility_and_issue(db, user_id)

def get_user_badges(db: Session, user_id: int):
    user_badges = db.query(models.UserBadge).filter(models.UserBadge.user_id == user_id).all()
    return [
        schemas.BadgeResponse(
            id=ub.badge.id,
            name=ub.badge.name,
            description=ub.badge.description
        )
        for ub in user_badges
    ]

def create_event(db: Session, event: schemas.EventCreate, user_id: int):
    db_event = models.Event(
        name=event.name,
        description=event.description,
        date=event.date,
        time=event.time,
        duration=event.duration,
        event_type=event.event_type,
        is_personal_training=event.is_personal_training,
        max_participants=event.max_participants,
        room_number=event.room_number,
        creator_id=user_id,
        post_id=event.post_id,
        driver_id=event.driver_id,
    )

    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    # ⭐ LINK THE POST TO THIS EVENT
    if event.post_id:
        db_post = db.query(models.Post).filter(models.Post.id == event.post_id).first()
        if db_post:
            db_post.event_id = db_event.id
            db.commit()

    return db_event



def get_event(db: Session, event_id: int, user_id: int):
    # Fetch the user based on their ID
    user = db.query(models.User).filter(models.User.id == user_id).first()

    # Admins can view any event
    if user.role == "admin":
        return db.query(models.Event).filter(models.Event.id == event_id).first()

    # Trainers can see events they created (public or private)
    elif user.role == "trainer":
        return db.query(models.Event).filter(models.Event.id == event_id, models.Event.creator_id == user_id).first()

    # Members can see their own private events and all public events
    else:  # For gym members
        return db.query(models.Event).filter(
            (models.Event.id == event_id) &
            ((models.Event.creator_id == user_id) |  # Their own events
             (models.Event.event_type == "public"))  # All public events
        ).first()


def get_events(db: Session, user_id: int, start: date = None, end: date = None) -> list[models.Event]:
    user = db.query(models.User).filter(models.User.id == user_id).first()

    if user.role == "admin":
        query = db.query(models.Event)

    elif user.role == "trainer":
        query = db.query(models.Event).filter(models.Event.creator_id == user_id)

    else:
        query = db.query(models.Event).filter(
            (models.Event.creator_id == user_id) |
            (models.Event.event_type == "public")
        )

    # Apply date range filter for all roles
    if start:
        query = query.filter(models.Event.date >= start)
    if end:
        query = query.filter(models.Event.date <= end)

    events = query.options(selectinload(models.Event.bookings)).all()

    for event in events:
        event.bookings_count = len(event.bookings)

    return events


def update_event(db: Session, event_id: int, event_update: schemas.EventCreate, user_id: int):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()

    if not db_event or (
        db_event.creator_id != user_id
        and db_event.trainer_id != user_id
        and not db.query(models.User).filter(models.User.id == user_id, models.User.role == "admin").first()
    ):
        return None

    # Update event fields
    db_event.name = event_update.name
    db_event.description = event_update.description
    db_event.date = event_update.date
    db_event.time = event_update.time
    db_event.duration = event_update.duration
    db_event.event_type = event_update.event_type
    db_event.max_participants = event_update.max_participants
    db_event.room_number = event_update.room_number
    db_event.driver_id = event_update.driver_id

    # ⭐ Update post link if changed
    if event_update.post_id != db_event.post_id:
        db_event.post_id = event_update.post_id

        # Update the Post → Event link
        db_post = db.query(models.Post).filter(models.Post.id == event_update.post_id).first()
        if db_post:
            db_post.event_id = db_event.id

    db.commit()
    db.refresh(db_event)
    return db_event


def delete_event(db: Session, event_id: int, user_id: int):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()

    if not db_event or (db_event.creator_id != user_id and
                        db_event.trainer_id != user_id and
                        not db.query(models.User).filter
                            (models.User.id == user_id, models.User.role == "admin").first()):
        return None

    db.delete(db_event)
    db.commit()
    return True

def get_posts_by_event(db: Session, event_id: int):
    return db.query(models.Post).filter(models.Post.event_id == event_id).all()

def get_event_with_posts(db: Session, event_id: int):
    return db.query(models.Event).filter(models.Event.id == event_id).first()


def send_booking_confirmation_email(
        to_email: str,
        name: str,
        description: str,
        departure_time: str,
        seat_number: int,
        booking_id: int,
        pdf_bytes: bytes = None
):
    try:
        # ✅ Inline HTML template (NO FILE NEEDED)
        html_content = f"""
        <html>
        <body style="font-family: Arial; background:#f4f6ff; padding:20px;">
            <div style="max-width:600px; margin:auto; background:white; padding:20px; border-radius:10px;">

                <h2 style="color:#3742fa; text-align:center;">MobilEase Ticket</h2>
                <p style="text-align:center; color:#666;">Bus Ticket Confirmation</p>

                <hr/>

                <p><strong>Passenger:</strong> {name}</p>
                <p><strong>Route:</strong> {description}</p>
                <p><strong>Departure:</strong> {departure_time}</p>
                <p><strong>Seat Number:</strong> {seat_number}</p>
                <p><strong>Booking ID:</strong> {booking_id}</p>

                <br/>

                <p style="text-align:center; font-size:12px; color:#aaa;">
                    This is an automated ticket — MobilEase Transport System
                </p>
            </div>
        </body>
        </html>
        """

        message = Mail(
            from_email=SENDER_EMAIL,
            to_emails=to_email,
            subject="Your MobilEase Ticket is Confirmed!",
            html_content=html_content
        )

        # ✅ Attach PDF
        if pdf_bytes is not None:
            encoded_pdf = base64.b64encode(pdf_bytes).decode()

            attachment = Attachment(
                FileContent(encoded_pdf),
                FileName(f"ticket_{booking_id}.pdf"),
                FileType("application/pdf"),
                Disposition("attachment")
            )

            message.attachment = attachment

        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)

        print(f"✅ Email sent: {response.status_code}")

    except Exception as e:
        print("❌ Email failed:", e)
        raise e


from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
import qrcode
import io

def generate_ticket_pdf_bytes(booking, event, user) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "title",
        fontSize=22,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#3742fa"),
        alignment=TA_CENTER,
        spaceAfter=6
    )
    sub_style = ParagraphStyle(
        "sub",
        fontSize=11,
        fontName="Helvetica",
        textColor=colors.HexColor("#605fc9"),
        alignment=TA_CENTER,
        spaceAfter=20
    )
    label_style = ParagraphStyle(
        "label",
        fontSize=10,
        fontName="Helvetica",
        textColor=colors.HexColor("#888888"),
    )
    value_style = ParagraphStyle(
        "value",
        fontSize=13,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#2d3436"),
    )

    elements = []

    elements.append(Paragraph("MobilEase", title_style))
    elements.append(Paragraph("Bus Ticket Confirmation", sub_style))
    elements.append(Spacer(1, 10))

    ticket_data = [
        [Paragraph("Passenger", label_style), Paragraph(f"{user.name} {user.surname}", value_style)],
        [Paragraph("Email", label_style), Paragraph(user.email, value_style)],
        [Paragraph("Event", label_style), Paragraph(event.name, value_style)],
        [Paragraph("Date & Time", label_style), Paragraph(f"{event.date} {event.time}", value_style)],
        [Paragraph("Seat Number", label_style), Paragraph(str(booking.seat_number), value_style)],
        [Paragraph("Booking ID", label_style), Paragraph(str(booking.id), value_style)],
    ]

    table = Table(ticket_data, colWidths=[50*mm, 110*mm])
    table.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.HexColor("#f8f9ff"), colors.white]),
        ("BOX",           (0, 0), (-1, -1), 0.5, colors.HexColor("#dde0f5")),
        ("INNERGRID",     (0, 0), (-1, -1), 0.25, colors.HexColor("#dde0f5")),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 20))

    qr_img = qrcode.make(booking.qr_code)
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)
    qr = Image(qr_buffer, width=45*mm, height=45*mm)
    qr.hAlign = "CENTER"
    elements.append(qr)

    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        "Scan QR code at boarding",
        ParagraphStyle("qrlabel", fontSize=9, fontName="Helvetica",
                       textColor=colors.HexColor("#adb5bd"), alignment=TA_CENTER)
    ))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(
        "This is an automated ticket — MobilEase Transport System",
        ParagraphStyle("footer", fontSize=8, fontName="Helvetica",
                       textColor=colors.HexColor("#adb5bd"), alignment=TA_CENTER)
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()

from sqlalchemy.exc import IntegrityError
def book_event(db: Session, event_id: int, user_id: int, seat_number: int):
    """
    Book a seat after checking Redis lock, generate QR/PDF ticket,
    and send email confirmation.
    """
    # ── Check Redis lock ──────────────────────────────
    key = f"seat_lock:{event_id}:{seat_number}"
    lock_owner = redis_client.get(key)

    if lock_owner is None:
        raise HTTPException(409, "Seat lock expired")
    if lock_owner != str(user_id):
        raise HTTPException(409, "Seat locked by another user")

    # ── Check if seat already booked ─────────────────
    taken = db.query(models.Booking).filter(
        models.Booking.event_id == event_id,
        models.Booking.seat_number == seat_number
    ).first()
    if taken:
        raise HTTPException(409, "Seat already booked")

    # ── Create booking record ────────────────────────
    booking = models.Booking(
        user_id=user_id,
        event_id=event_id,
        seat_number=seat_number
    )

    # Generate QR code for booking
    qr_data = generate_booking_qr(event_id, user_id, seat_number)
    booking.qr_code = qr_data

    db.add(booking)

    try:
        db.commit()
        db.refresh(booking)

        # Remove Redis lock after booking success
        redis_client.delete(key)

        # ── Fetch event & user info for email ──────────
        event = db.query(models.Event).filter(models.Event.id == event_id).first()
        user = db.query(models.User).filter(models.User.id == user_id).first()

        # Generate PDF ticket
        pdf_bytes = generate_ticket_pdf_bytes(booking, event, user)

        # Send email with PDF attachment
        send_booking_confirmation_email(
            to_email=user.email,
            name=f"{user.name} {user.surname}",
            description=event.description or "Event details",
            departure_time=f"{event.date} {event.time}",
            seat_number=seat_number,
            booking_id=booking.id,
            pdf_bytes=pdf_bytes
        )

        print(f"✅ Booking created and email sent to {user.email}")
        return booking

    except IntegrityError:
        db.rollback()
        redis_client.delete(key)
        raise HTTPException(409, "Seat already booked")
    except Exception as e:
        db.rollback()
        redis_client.delete(key)
        print(f"❌ Failed to send booking email: {e}")
        raise HTTPException(500, "Booking created but email failed")


def generate_qr_code_data(user_id: int, db: Session) -> str:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise ValueError("User not found")

    company = user.company
    if not company:
        raise ValueError("User does not belong to any company")

    qr_content = {
        "user_id": user.id,
        "name": user.name,
        "surname": user.surname,
        "email": user.email,
        "company_name": company.name,
        "company_industry": company.industry,
        "company_domain": company.domain,
        "reward": "day_off",
        "issued_at": datetime.utcnow().isoformat(),
        "status": "issued",
    }

    import json
    qr_content_str = json.dumps(qr_content)

    qr = QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_content_str)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffer = BytesIO()
    img.save(buffer, format="PNG")

    img_bytes = buffer.getvalue()
    return base64.b64encode(img_bytes).decode("utf-8")

def generate_booking_qr(event_id: int, user_id: int, seat_number: int) -> str:
    qr_content = {
        "event_id": event_id,
        "user_id": user_id,
        "seat_number": seat_number,
        "issued_at": datetime.utcnow().isoformat(),
        "status": "valid"
    }

    qr_content_str = json.dumps(qr_content)

    qr = QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_content_str)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffer = BytesIO()
    img.save(buffer, format="PNG")

    return base64.b64encode(buffer.getvalue()).decode("utf-8")

def cancel_booking(db: Session, booking_id: int):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()

    if not booking:
        return None

    db.delete(booking)
    db.commit()
    return True


# Fetch bookings for a specific user
def get_bookings_by_user(db: Session, user_id: int):
    return db.query(models.Booking).filter(models.Booking.user_id == user_id).all()


# Fetch bookings for a specific event
def get_bookings_by_event(db: Session, event_id: int):
    return db.query(models.Booking).filter(models.Booking.event_id == event_id).all()



#CRUD comment
def create_comment(db: Session, comment_data: schemas.CommentCreate):
    new_comment = models.Comment(
        content=comment_data.content,
        post_id=comment_data.post_id,
        user_id=comment_data.user_id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment


def get_comment(db: Session, comment_id: int):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    return comment


def get_comments_by_post(db: Session, post_id: int):
    return db.query(models.Comment).filter(models.Comment.post_id == post_id).all()


def get_comments_by_user(db: Session, user_id: int):
    return db.query(models.Comment).filter(models.Comment.user_id == user_id).all()


def update_comment(db: Session, comment_id: int, comment_update: schemas.CommentBase):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment.content = comment_update.content
    db.commit()
    db.refresh(comment)
    return comment


def delete_comment(db: Session, comment_id: int):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    db.delete(comment)
    db.commit()
    return True


# Initiative CRUD operations
def create_initiative(db: Session, initiative: schemas.InitiativeCreate, user_id: int, company_id: int):
    db_initiative = models.Initiative(
        title=initiative.title,
        description=initiative.description,
        created_by=user_id,
        month=initiative.month,
        year=initiative.year,
        company_id=company_id,
        status="pending"
    )
    db.add(db_initiative)
    db.commit()
    db.refresh(db_initiative)
    return db_initiative


def get_initiative(db: Session, initiative_id: int):
    return db.query(models.Initiative).filter(models.Initiative.id == initiative_id).first()


# Update the function in crud.py
def get_initiatives(db: Session, company_id: int, status: Optional[str] = None, month: Optional[int] = None,
                    year: Optional[int] = None, include_archived: bool = False):
    query = db.query(models.Initiative).filter(models.Initiative.company_id == company_id)

    if status:
        query = query.filter(models.Initiative.status == status)
    elif not include_archived:
        # By default, exclude archived initiatives unless explicitly requested
        query = query.filter(models.Initiative.status != "archived")

    if month:
        query = query.filter(models.Initiative.month == month)
    if year:
        query = query.filter(models.Initiative.year == year)

    return query.all()


def update_initiative(db: Session, initiative_id: int, initiative: schemas.InitiativeCreate):
    db_initiative = get_initiative(db, initiative_id)
    if db_initiative:
        db_initiative.title = initiative.title
        db_initiative.description = initiative.description
        db_initiative.month = initiative.month
        db_initiative.year = initiative.year
        db.commit()
        db.refresh(db_initiative)
    return db_initiative


def delete_initiative(db: Session, initiative_id: int):
    db_initiative = get_initiative(db, initiative_id)
    if db_initiative:
        db.delete(db_initiative)
        db.commit()
        return True
    return False


# Update this function in crud.py
def activate_initiative(db: Session, initiative_id: int):
    # Get the initiative to be activated
    db_initiative = get_initiative(db, initiative_id)
    if not db_initiative:
        return None

    # Update: Always set to current month and year when manually activated by admin
    current_date = datetime.now()

    # Update the initiative to current month/year
    db_initiative.month = current_date.month
    db_initiative.year = current_date.year

    # First, set all active initiatives to completed
    active_initiatives = db.query(models.Initiative).filter(
        models.Initiative.status == "active",
        models.Initiative.company_id == db_initiative.company_id  # Only affect same company's initiatives
    ).all()

    for initiative in active_initiatives:
        initiative.status = "completed"

    # Set all other pending initiatives from the same month/year to "archived"
    pending_initiatives = db.query(models.Initiative).filter(
        models.Initiative.status == "pending",
        models.Initiative.month == current_date.month,
        models.Initiative.year == current_date.year,
        models.Initiative.company_id == db_initiative.company_id,
        models.Initiative.id != initiative_id  # Exclude the initiative being activated
    ).all()

    for initiative in pending_initiatives:
        initiative.status = "archived"

    # Finally, activate the selected initiative
    db_initiative.status = "active"
    db.commit()
    db.refresh(db_initiative)

    return db_initiative


def get_active_initiative(db: Session, company_id: int):
    """Get the currently active initiative for a company."""
    return db.query(models.Initiative).filter(
        models.Initiative.company_id == company_id,
        models.Initiative.status == "active"
    ).first()


# Vote CRUD operations
def create_vote(db: Session, user_id: int, initiative_id: int):
    # Check if user has already voted for this initiative
    existing_vote = db.query(models.Vote).filter(
        models.Vote.user_id == user_id,
        models.Vote.initiative_id == initiative_id
    ).first()

    if existing_vote:
        return existing_vote

    db_vote = models.Vote(
        user_id=user_id,
        initiative_id=initiative_id
    )
    db.add(db_vote)
    db.commit()
    db.refresh(db_vote)
    return db_vote


def delete_vote(db: Session, user_id: int, initiative_id: int):
    db_vote = db.query(models.Vote).filter(
        models.Vote.user_id == user_id,
        models.Vote.initiative_id == initiative_id
    ).first()

    if db_vote:
        db.delete(db_vote)
        db.commit()
        return True
    return False


def get_votes_by_initiative(db: Session, initiative_id: int):
    return db.query(models.Vote).filter(models.Vote.initiative_id == initiative_id).all()


def get_voting_results(db: Session, company_id: int, month: int, year: int):
    # Get all initiatives for the specified month and year
    initiatives = db.query(models.Initiative).filter(
        models.Initiative.company_id == company_id,
        models.Initiative.month == month,
        models.Initiative.year == year
    ).all()

    results = []
    for initiative in initiatives:
        vote_count = db.query(models.Vote).filter(models.Vote.initiative_id == initiative.id).count()
        results.append({
            "id": initiative.id,
            "title": initiative.title,
            "description": initiative.description,
            "created_by": initiative.created_by,
            "vote_count": vote_count
        })

    # Sort by vote count (descending)
    results.sort(key=lambda x: x["vote_count"], reverse=True)

    return results


# Progress CRUD operations
def create_or_update_progress(db: Session, user_id: int, progress: schemas.ProgressCreate):
    """Create or update progress for a user on an initiative."""
    # Check if progress entry already exists
    db_progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == user_id,
        models.UserProgress.initiative_id == progress.initiative_id
    ).first()

    # Handle the details field properly
    details_json = None
    if progress.details:
        # If it's already a string, use it directly or fix it
        if isinstance(progress.details, str):
            try:
                # Try to parse it to ensure it's valid JSON
                json.loads(progress.details)
                details_json = progress.details
            except:
                # If not valid JSON, try to handle it as a dict-like string
                try:
                    # Instead of discarding, try to salvage the data
                    print(f"Warning: Invalid JSON in progress.details: {progress.details}")
                    # If it's a dict-like value, convert it properly
                    if isinstance(progress.details, dict):
                        details_json = json.dumps(progress.details)
                    else:
                        # Last resort fallback
                        details_json = json.dumps({"checkedDays": []})
                except:
                    details_json = json.dumps({"checkedDays": []})
        else:
            # If it's a dict or any other type, convert to JSON
            try:
                details_json = json.dumps(progress.details)
                print(f"Converted dict to JSON: {details_json}")
            except Exception as e:
                print(f"Error converting details to JSON: {e}")
                details_json = json.dumps({"checkedDays": []})
    else:
        # Default empty details
        details_json = json.dumps({"checkedDays": []})

    # For debugging - print exactly what we're saving
    print(f"Type of details before saving: {type(progress.details)}")
    print(f"Saving progress with details: {details_json}")

    if db_progress:
        db_progress.progress = progress.progress
        db_progress.completed = progress.completed
        db_progress.details = details_json
    else:
        db_progress = models.UserProgress(
            user_id=user_id,
            initiative_id=progress.initiative_id,
            progress=progress.progress,
            completed=progress.completed,
            details=details_json
        )
        db.add(db_progress)

    db.commit()
    db.refresh(db_progress)

    # Validate what was actually saved
    print(f"Saved progress ID: {db_progress.id}")
    print(f"Saved details in DB: {db_progress.details}")

    return db_progress


def get_company_progress(db: Session, company_id: int, initiative_id: int):
    # Get all users in the company
    users = db.query(models.User).filter(models.User.company_id == company_id).all()
    user_ids = [user.id for user in users]

    # Get progress for these users on the specific initiative
    progress_entries = db.query(models.UserProgress).filter(
        models.UserProgress.user_id.in_(user_ids),
        models.UserProgress.initiative_id == initiative_id
    ).all()

    return progress_entries


def award_initiative_completion_badge(db: Session, user_id: int):
    # Ensure user exists
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        print(f"[ERROR] User ID {user_id} not found.")
        return False

    # Create badge if not exists
    badge_name = "Initiative Champion"
    initiative_badge = db.query(models.Badge).filter(models.Badge.name == badge_name).first()

    if not initiative_badge:
        initiative_badge = models.Badge(
            name=badge_name,
            description="Completed a company monthly challenge."
        )
        db.add(initiative_badge)
        db.commit()
        db.refresh(initiative_badge)

    # Check if user already has this badge
    existing_badge = db.query(models.UserBadge).filter(
        models.UserBadge.user_id == user_id,
        models.UserBadge.badge_id == initiative_badge.id
    ).first()

    if not existing_badge:
        try:
            user_badge = models.UserBadge(user_id=user_id, badge_id=initiative_badge.id)
            db.add(user_badge)
            db.commit()
        except Exception as e:
            print(f"[ERROR] Failed to assign user badge: {e}")
            db.rollback()
            return False
    else:
        print(f"[INFO] User {user_id} already has the Initiative Champion badge.")

    # Call this after badge is awarded
    check_day_off_eligibility_and_issue(db, user_id)
    return True




# Add these functions to crud.py

from datetime import datetime, timedelta
from sqlalchemy import and_, func


def check_user_has_pending_initiative(db: Session, user_id: int):
    """Check if the user already has a pending initiative for the next month."""
    try:
        # Import required modules if not already at the top of the file
        from datetime import datetime, timedelta

        current_date = datetime.now()
        next_month_date = current_date.replace(day=1) + timedelta(days=32)
        next_month = next_month_date.month
        next_year = next_month_date.year

        pending_initiative = db.query(models.Initiative).filter(
            models.Initiative.created_by == user_id,
            models.Initiative.month == next_month,
            models.Initiative.year == next_year,
            models.Initiative.status.in_(["pending", "active"])
        ).first()

        return pending_initiative is not None
    except Exception as e:
        # Log the error but don't break the application
        print(f"Error in check_user_has_pending_initiative: {str(e)}")
        # Default to False (allow creating) in case of error
        return False

def mark_initiatives_as_failed(db: Session, company_id: int, month: int, year: int, exclude_initiative_id: int = None):
    """Mark all pending initiatives for a month as failed, except the one being activated."""
    # Calculate auto-delete date (15th of the current month)
    auto_delete_date = datetime(year, month, 15)

    # Get all pending initiatives for this month/year except the one being activated
    query = db.query(models.Initiative).filter(
        models.Initiative.company_id == company_id,
        models.Initiative.month == month,
        models.Initiative.year == year,
        models.Initiative.status == "pending"
    )

    if exclude_initiative_id:
        query = query.filter(models.Initiative.id != exclude_initiative_id)

    initiatives = query.all()

    # Mark as failed and set auto-delete date
    for initiative in initiatives:
        initiative.status = "failed"
        initiative.auto_delete_date = auto_delete_date

    db.commit()
    return initiatives


def auto_activate_top_initiative(db: Session, company_id: int, month: int, year: int):
    """Automatically activate the initiative with the most votes."""
    # First, get all pending initiatives
    pending_initiatives = db.query(models.Initiative).filter(
        models.Initiative.company_id == company_id,
        models.Initiative.month == month,
        models.Initiative.year == year,
        models.Initiative.status == "pending"
    ).all()

    if not pending_initiatives:
        return None

    # Count votes for each initiative
    initiatives_with_votes = []
    for initiative in pending_initiatives:
        vote_count = db.query(models.Vote).filter(
            models.Vote.initiative_id == initiative.id
        ).count()
        initiatives_with_votes.append((initiative, vote_count))

    # Sort by vote count (descending)
    initiatives_with_votes.sort(key=lambda x: x[1], reverse=True)

    if not initiatives_with_votes:
        return None

    # Take the top initiative
    top_initiative, _ = initiatives_with_votes[0]

    # Mark all others as failed
    mark_initiatives_as_failed(db, company_id, month, year, top_initiative.id)

    # Set the top initiative as active and locked
    top_initiative.status = "active"
    top_initiative.is_locked = True

    # First, set all active initiatives to completed
    active_initiatives = db.query(models.Initiative).filter(
        models.Initiative.company_id == company_id,
        models.Initiative.status == "active"
    ).all()

    for initiative in active_initiatives:
        initiative.status = "completed"

    db.commit()
    db.refresh(top_initiative)

    return top_initiative


def deactivate_initiative(db: Session, initiative_id: int):
    """Deactivate an initiative and start a 3-day voting period."""
    initiative = get_initiative(db, initiative_id)
    if not initiative or initiative.status != "active":
        return None

    # Can't deactivate locked initiative
    if initiative.is_locked:
        return None

    # Set initiative as completed
    initiative.status = "completed"

    # Set voting end date for 3 days from now
    voting_end_date = datetime.now() + timedelta(days=3)

    # Update all pending initiatives with the voting end date
    pending_initiatives = db.query(models.Initiative).filter(
        models.Initiative.company_id == initiative.company_id,
        models.Initiative.month == initiative.month,
        models.Initiative.year == initiative.year,
        models.Initiative.status == "pending"
    ).all()

    for pending in pending_initiatives:
        pending.voting_end_date = voting_end_date

    db.commit()
    return voting_end_date


def check_expired_voting_periods(db: Session):
    """Check for any expired voting periods and activate the top initiative."""
    current_time = datetime.now()

    # Get initiatives with expired voting periods
    initiatives_with_expired_voting = db.query(models.Initiative).filter(
        models.Initiative.voting_end_date <= current_time,
        models.Initiative.status == "pending"
    ).all()

    if not initiatives_with_expired_voting:
        return

    # Group by company_id, month, year
    grouped_initiatives = {}
    for initiative in initiatives_with_expired_voting:
        key = (initiative.company_id, initiative.month, initiative.year)
        if key not in grouped_initiatives:
            grouped_initiatives[key] = []
        grouped_initiatives[key].append(initiative)

    # For each group, activate the top initiative
    for (company_id, month, year), _ in grouped_initiatives.items():
        auto_activate_top_initiative(db, company_id, month, year)


def check_monthly_auto_activation(db: Session):
    """Check if it's the 1st of the month and activate initiatives."""
    current_date = datetime.now()

    # Only run on the 1st of the month
    if current_date.day != 1:
        return

    # Get all companies
    companies = db.query(models.Company).all()

    for company in companies:
        # Activate the top initiative for each company
        auto_activate_top_initiative(db, company.id, current_date.month, current_date.year)


def cleanup_failed_initiatives(db: Session):
    """Delete failed initiatives that have reached their auto-delete date."""
    current_time = datetime.now()

    # Get initiatives that should be deleted
    initiatives_to_delete = db.query(models.Initiative).filter(
        models.Initiative.auto_delete_date <= current_time,
        models.Initiative.status == "failed"
    ).all()

    # Delete them
    for initiative in initiatives_to_delete:
        db.delete(initiative)

    db.commit()
    return len(initiatives_to_delete)


def check_and_assign_sustainability_badge(db: Session, user_id: int):
    badge_name = "Eco Explorer"
    badge_description = "Attended 3 Sustainability Events"

    # Count how many sustainability events the user attended
    sustainability_events_attended = db.query(models.Booking).join(models.Event).filter(
        models.Booking.user_id == user_id
    ).count()

    if sustainability_events_attended < 3:
        return  # User hasn't qualified yet

    # Check if badge exists or create it
    badge = db.query(models.Badge).filter(models.Badge.name == badge_name).first()
    if not badge:
        badge = models.Badge(name=badge_name, description=badge_description)
        db.add(badge)
        db.commit()

    # Check if user already has it
    user_has_badge = db.query(models.UserBadge).filter(
        models.UserBadge.user_id == user_id,
        models.UserBadge.badge_id == badge.id
    ).first()

    if not user_has_badge:
        db.add(models.UserBadge(user_id=user_id, badge_id=badge.id))
        db.commit()

    check_day_off_eligibility_and_issue(db, user_id)



def check_and_assign_climate_champion_badge(db: Session, user_id: int, total_footprint: float, season=None, year=None):
    badge_name = "Climate Champion"
    badge_description = "Reached the 2030 seasonal CO₂ goal (≤ 625 kg)"

    # Only proceed if footprint is within goal
    if total_footprint > 625:
        return

    # Check if badge exists
    badge = db.query(models.Badge).filter(models.Badge.name == badge_name).first()
    if not badge:
        badge = models.Badge(name=badge_name, description=badge_description)
        db.add(badge)
        db.commit()

    # Check if user already has this badge
    user_has_badge = db.query(models.UserBadge).filter(
        models.UserBadge.user_id == user_id,
        models.UserBadge.badge_id == badge.id
    ).first()

    if not user_has_badge:
        db.add(models.UserBadge(user_id=user_id, badge_id=badge.id))
        db.commit()

    check_day_off_eligibility_and_issue(db, user_id)

def has_earned_day_off(db: Session, user_id: int) -> bool:
    badge_count = db.query(models.UserBadge).filter(models.UserBadge.user_id == user_id).count()
    return badge_count >= 5




def check_day_off_eligibility_and_issue(db: Session, user_id: int):
    if not has_earned_day_off(db, user_id):
        return

    # Check if already has voucher
    existing = db.query(models.Reward).filter_by(
        user_id=user_id, type="day_off", status="issued"
    ).first()
    if existing:
        return

    # ✅ Issue reward and generate QR
    reward = models.Reward(
        user_id=user_id,
        type="day_off",
        status="issued",
        qr_code=generate_qr_code_data(user_id, db)
    )
    db.add(reward)
    db.commit()

def get_user_progress(db: Session, user_id: int, initiative_id: Optional[int] = None):
    query = db.query(models.UserProgress).filter(models.UserProgress.user_id == user_id)

    if initiative_id:
        query = query.filter(models.UserProgress.initiative_id == initiative_id)

    return query.all()

def deactivate_initiative(db: Session, initiative_id: int):
    """Deactivate an initiative and start a 3-day voting period."""
    initiative = get_initiative(db, initiative_id)
    if not initiative or initiative.status != "active":
        return None

    # Can't deactivate locked initiative
    if initiative.is_locked:
        return None

    # Set initiative as completed
    initiative.status = "completed"

    # Set voting end date for 3 days from now
    voting_end_date = datetime.now() + timedelta(days=3)

    # Update all pending initiatives with the voting end date
    pending_initiatives = db.query(models.Initiative).filter(
        models.Initiative.company_id == initiative.company_id,
        models.Initiative.month == initiative.month,
        models.Initiative.year == initiative.year,
        models.Initiative.status == "pending"
    ).all()

    for pending in pending_initiatives:
        pending.voting_end_date = voting_end_date

    db.commit()


    return voting_end_date

def create_car(db: Session, car: schemas.CarCreate):
    db_car = models.Car(
        brand=car.brand,
        model=car.model,
        year=car.year,
        license_plate=car.license_plate,
        seats=car.seats,
        transmission=car.transmission,
        fuel_type=car.fuel_type,
        price_per_hour=car.price_per_hour,
        price_per_day=car.price_per_day,
        price_per_km=car.price_per_km,
        available=car.available,
        # ✅ Default location: Kaunas Bus Station
        current_location="Kaunas Bus Station, Vytauto pr. 24, Kaunas, Lithuania",
        current_lat=54.889444,
        current_lng=23.928167,
    )

    db.add(db_car)
    db.commit()
    db.refresh(db_car)
    return db_car

def get_car(db: Session, car_id: int):
    return db.query(models.Car).filter(models.Car.id == car_id).first()

def get_cars(db: Session):
    return db.query(models.Car).all()

def update_car(db: Session, car_id: int, car_update: schemas.CarUpdate):
    db_car = db.query(models.Car).filter(models.Car.id == car_id).first()
    if not db_car:
        return None

    update_data = car_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_car, key, value)

    db.commit()
    db.refresh(db_car)
    return db_car


def delete_car(db: Session, car_id: int):
    db_car = db.query(models.Car).filter(models.Car.id == car_id).first()
    if not db_car:
        return None

    db.delete(db_car)
    db.commit()
    return True

# ⭐ PRICE CALCULATION (included directly here)
def calculate_rental_price(car, start_datetime: datetime, end_datetime: datetime, kilometers_used: float):
    """
    Calculates rental price using:
    - price per hour
    - price per day
    - price per km
    - platform fee €0.30
    """

    MIN_FEE = 0.30

    # Duration in hours
    duration_seconds = (end_datetime - start_datetime).total_seconds()
    hours = duration_seconds / 3600

    # Convert hours to days
    days = hours // 24
    remaining_hours = hours % 24

    # Time cost
    time_cost = (days * car.price_per_day) + (remaining_hours * car.price_per_hour)

    # Distance cost
    distance_cost = kilometers_used * car.price_per_km

    total = time_cost + distance_cost + MIN_FEE

    return round(total, 2)



# ⭐ CREATE RENTAL (uses ORS distance from frontend)
def create_car_rental(db: Session, rental: schemas.CarRentalCreate, user_id: int):
    car = db.query(models.Car).filter(models.Car.id == rental.car_id).first()
    if not car or not car.available:
        return None

    km_used = rental.kilometers_used

    total_price = calculate_rental_price(
        car,
        rental.start_datetime,
        rental.end_datetime,
        km_used
    )

    db_rental = models.CarRental(
        user_id=user_id,
        car_id=rental.car_id,
        pickup_location=rental.pickup_location,
        dropoff_location=rental.dropoff_location,
        pickup_lat=rental.pickup_lat,
        pickup_lng=rental.pickup_lng,
        dropoff_lat=rental.dropoff_lat,
        dropoff_lng=rental.dropoff_lng,
        start_datetime=rental.start_datetime,
        end_datetime=rental.end_datetime,
        kilometers_used=km_used,
        total_price=total_price,
        status="pending_payment",
    )

    db.add(db_rental)
    db.commit()
    db.refresh(db_rental)
    return db_rental

import random
import hashlib

def generate_pin():
    return str(random.randint(1000, 9999))

def hash_pin(pin: str):
    return hashlib.sha256(pin.encode()).hexdigest()


def confirm_rental_payment(db: Session, rental_id: int):
    rental = db.query(models.CarRental).filter(
        models.CarRental.id == rental_id
    ).first()

    if not rental:
        return None

    rental.status = "reserved"

    # 👇 generate PIN
    pin = generate_pin()
    rental.pin_hash = hash_pin(pin)

    car = rental.car
    car.available = False

    db.commit()
    db.refresh(rental)

    # ⚠️ return PIN ONLY ONCE (frontend display)
    rental.plain_pin = pin

    return rental

# ⭐ UPDATE RENTAL (also uses ORS distance)
def update_car_rental(db: Session, rental_id: int, rental_update: schemas.CarRentalUpdate):
    db_rental = db.query(models.CarRental).filter(models.CarRental.id == rental_id).first()
    if not db_rental:
        return None

    update_data = rental_update.dict(exclude_unset=True)

    # Apply updates
    for key, value in update_data.items():
        setattr(db_rental, key, value)

    # ⭐ If kilometers updated → use ORS distance
    km_used = update_data.get("kilometers_used", db_rental.kilometers_used)

    # ⭐ Recalculate price
    car = db_rental.car
    db_rental.total_price = calculate_rental_price(
        car,
        db_rental.start_datetime,
        db_rental.end_datetime,
        km_used
    )

    # Free car if completed
    if db_rental.status == "completed":
        db_rental.car.available = True
        # ✅ Add these 3 lines:
        db_rental.car.current_location = db_rental.dropoff_location
        db_rental.car.current_lat = db_rental.dropoff_lat
        db_rental.car.current_lng = db_rental.dropoff_lng

    db.commit()
    db.refresh(db_rental)
    return db_rental

def delete_car_rental(db: Session, rental_id: int):
    db_rental = db.query(models.CarRental).filter(models.CarRental.id == rental_id).first()
    if not db_rental:
        return None

    db_rental.car.available = True
    db.delete(db_rental)
    db.commit()
    return True


def finalize_if_expired(rental):
    now = datetime.utcnow()

    if rental.status in ["reserved", "pending_payment"] and rental.end_datetime < now:
        rental.status = "completed"

        car = rental.car
        car.available = True
        car.current_location = rental.dropoff_location
        car.current_lat = rental.dropoff_lat
        car.current_lng = rental.dropoff_lng

def get_user_rentals(db: Session, user_id: int):
    rentals = (
        db.query(models.CarRental)
        .filter(models.CarRental.user_id == user_id)
        .order_by(models.CarRental.start_datetime.asc())
        .all()
    )

    for r in rentals:
        finalize_if_expired(r)

    db.commit()
    return rentals


def get_car_rentals(db: Session):
    rentals = db.query(models.CarRental).order_by(
        models.CarRental.start_datetime.asc()
    ).all()

    for r in rentals:
        finalize_if_expired(r)

    db.commit()
    return rentals

def create_car_image(db: Session, car_id: int, url: str):
    db_image = models.CarImage(
        car_id=car_id,
        url=url
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image


def get_car_image(db: Session, car_id: int, image_id: int):
    return db.query(models.CarImage).filter(
        models.CarImage.id == image_id,
        models.CarImage.car_id == car_id
    ).first()

def get_car_images(db: Session, car_id: int):
    return db.query(models.CarImage).filter(
        models.CarImage.car_id == car_id
    ).all()

def delete_car_image(db: Session, image_id: int):
    db_image = db.query(models.CarImage).filter(
        models.CarImage.id == image_id
    ).first()

    if not db_image:
        return None

    db.delete(db_image)
    db.commit()
    return True

from datetime import datetime, timedelta

def auto_free_car(db: Session, car: models.Car):
    now = datetime.utcnow()

    rental = (
        db.query(models.CarRental)
        .filter(
            models.CarRental.car_id == car.id,
            models.CarRental.status.in_(["reserved", "active"])
        )
        .order_by(models.CarRental.end_datetime.desc())
        .first()
    )

    if rental:
        if rental.end_datetime + timedelta(minutes=1) < now:
            car.available = True
            rental.status = "completed"

            # ✅ Update car location to dropoff when auto-completed
            if rental.dropoff_lat and rental.dropoff_lng:
                car.current_location = rental.dropoff_location
                car.current_lat = rental.dropoff_lat
                car.current_lng = rental.dropoff_lng

            db.commit()
            db.refresh(car)
            db.refresh(rental)
