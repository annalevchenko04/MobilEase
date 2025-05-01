from typing import Any

from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload
import models
import schemas
from pydantic import json
from passlib.context import CryptContext
from send_email import send_welcome_email
from send_company_email import send_company_registration_email
from sqlalchemy.exc import IntegrityError
import json
import logging
from qrcode import QRCode
import datetime
import base64
from io import BytesIO


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)

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
        # Extract domain from email
        email_domain = user.email.split('@')[-1].lower()
        company = db.query(models.Company).filter(models.Company.domain == email_domain).first()

        if not company:
            raise HTTPException(status_code=400,
                                detail=f"No company registered with domain '{email_domain}'. Please contact your company admin.")

        user_data["company_id"] = company.id  # Link user to company

        member_data = {
            "membership_status": user.membership_status,
        }
        db_user = models.Member(**user_data, **member_data)
    elif user.role == "admin":
        db_user = models.Admin(**user_data)
    else:
        raise ValueError("Invalid role specified")

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    send_welcome_email(db_user.email, db_user.name)

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
        "company": {
            "name": db_user.company.name,
            "domain": db_user.company.domain,
            "industry": db_user.company.industry
        } if db_user.company else None
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
        send_company_registration_email(new_company.name, new_admin.email)

        return new_admin

    except IntegrityError as e:
        db.rollback()  # Rollback company creation if admin creation fails
        raise HTTPException(status_code=400, detail="An error occurred while creating the company admin. Username might already be taken.")

    except Exception as e:
        db.rollback()  # Ensure rollback on any unexpected error
        raise HTTPException(status_code=500, detail="Unexpected server error occurred.")


def get_user(db: Session, username: str):
    db_user = db.query(models.User).options(joinedload(models.User.company)).filter(models.User.username == username).first()
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
        member_details = schemas.Member(
            membership_status=member_data.membership_status,
        )

    company_info = None
    if db_user.company:
        company_info = schemas.Company(
            name=db_user.company.name,
            domain=db_user.company.domain,
            industry=db_user.company.industry
        )

    return schemas.UserResponse(
        **user_data,
        member_details=member_details,
        company=company_info
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


def update_user(db: Session, user_id: int, user_update: schemas.UserCreate):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        return None

    db_user.username = user_update.username
    db_user.email = user_update.email
    db_user.hashed_password = pwd_context.hash(user_update.password)
    db_user.name = user_update.name
    db_user.surname = user_update.surname
    db_user.age = user_update.age
    db_user.gender = user_update.gender
    db_user.phone = user_update.phone
    db_user.role = user_update.role

    if user_update.role == "member":
        if isinstance(db_user, models.Member):
            db_user.membership_status = user_update.membership_status
        else:
            raise ValueError("The user is not a member")
    elif user_update.role == "admin":
        if not isinstance(db_user, models.Admin):
            raise ValueError("The user is not an admin")

    db.commit()
    db.refresh(db_user)

    return schemas.UserResponse.model_validate(db_user)


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


def save_carbon_footprint(db: Session, user_id: int, total_footprint: float, details: dict, season=None, year=None):
    if not user_id:
        raise ValueError("User ID is missing. Only authenticated users can submit their footprint.")

    combined_details = {
        **details['numeric_data'],
        **details['non_numeric_data']
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
        content=post.content,
        category=post.category,
        tags=post.tags,
        status="draft",  # Default status
        user_id=user_id  # Associate the post with the member (author)
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

    db_post.title = post_update.title
    db_post.content = post_update.content
    db_post.category = post_update.category
    db_post.tags = post_update.tags

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

    if favorite_count >= 3:
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
        creator_id=user_id,  # 'creator_id' field to link to the user who created the event
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
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


def get_events(db: Session, user_id: int) -> list[models.Event]:
    # Fetch the user based on their ID
    user = db.query(models.User).filter(models.User.id == user_id).first()

    # Admins can view all events
    if user.role == "admin":
        return db.query(models.Event).all()

    # Trainers can see events they created (public or private)
    elif user.role == "trainer":
        return db.query(models.Event).filter(models.Event.creator_id == user_id).all()

    # Members can see their own private events and all public events
    else:  # For gym members
        return db.query(models.Event).filter(
            (models.Event.creator_id == user_id) |  # Their own events
            (models.Event.event_type == "public")  # All public events
        ).all()


def update_event(db: Session, event_id: int, event_update: schemas.EventCreate, user_id: int):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()

    if not db_event or (
            db_event.creator_id != user_id and db_event.trainer_id != user_id and not db.query(models.User).filter(
            models.User.id == user_id, models.User.role == "admin").first()):
        return None

    db_event.name = event_update.name
    db_event.description = event_update.description
    db_event.date = event_update.date
    db_event.time = event_update.time
    db_event.duration = event_update.duration
    db_event.event_type = event_update.event_type
    db_event.max_participants = event_update.max_participants
    db_event.room_number = event_update.room_number

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


# Booking Management
def book_event(db: Session, event_id: int, user_id: int):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.max_participants and len(event.bookings) >= event.max_participants:
        raise HTTPException(status_code=400, detail="Event is fully booked")

    # Create booking
    db_booking = models.Booking(user_id=user_id, event_id=event_id)
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)

    check_and_assign_sustainability_badge(db, user_id)

    return db_booking


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
    return badge_count >= 4


def generate_qr_code_data(user_id: int, db: Session) -> str:
    # Fetch user details from the database
    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not user:
        raise ValueError("User not found")

    # Fetch the company details associated with the user
    company = user.company  # This uses the relationship defined in the User model

    if not company:
        raise ValueError("User does not belong to any company")

    # Prepare the additional data for the QR code
    qr_content = {
        "user_id": user.id,
        "name": user.name,
        "surname": user.surname,
        "email": user.email,
        "company_name": company.name,  # Company name
        "company_industry": company.industry,  # Company industry
        "company_domain": company.domain,  # Company domain
        "reward": "day_off",  # You can replace this if different reward types are added
        "issued_at": datetime.datetime.utcnow().isoformat(),  # Add current timestamp
        "status": "issued",  # Example of reward status
    }

    # Convert the dictionary to a string (e.g., JSON or query string format)
    import json
    qr_content_str = json.dumps(qr_content)

    # Initialize the QR code
    qr = QRCode(
        version=1,
        box_size=10,
        border=5
    )

    qr.add_data(qr_content_str)
    qr.make(fit=True)

    # Generate the QR code image
    img = qr.make_image(fill_color="black", back_color="white")

    # Save the image to a buffer
    buffer = BytesIO()
    img.save(buffer, format="PNG")

    # Get the image bytes and encode them as base64
    img_bytes = buffer.getvalue()
    return base64.b64encode(img_bytes).decode('utf-8')



def check_day_off_eligibility_and_issue(db: Session, user_id: int):
    if not has_earned_day_off(db, user_id):
        return

    # Check if already has voucher
    existing = db.query(models.Reward).filter_by(user_id=user_id, type="day_off").first()
    if existing and existing.status == "issued":
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




