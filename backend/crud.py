from typing import Any

from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload
import models
import schemas
from passlib.context import CryptContext

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

    return schemas.UserResponse.model_validate(db_user)


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
