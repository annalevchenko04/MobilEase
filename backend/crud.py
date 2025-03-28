from typing import Any

from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload
import models
import schemas
from passlib.context import CryptContext
from send_email import send_welcome_email
from send_company_email import send_company_registration_email
from sqlalchemy.exc import IntegrityError

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

    # ✅ DO NOT assign a Pydantic model to db_user.company
    # Instead, prepare Pydantic fields manually for return

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



def get_user(db: Session, username: str):
    print("🔍 get_user() called with username:", username)

    db_user = db.query(models.User).options(joinedload(models.User.company)).filter(models.User.username == username).first()
    if not db_user:
        print("❌ No user found in models.User with username:", username)
        return None

    print("✅ Found user:", db_user.username, "role:", db_user.role)

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
        print("🔍 Looking up member details for user ID:", db_user.id)
        member_data = db.query(models.Member).filter(models.Member.id == db_user.id).first()
        if not member_data:
            print("❌ No matching member found for ID:", db_user.id)
        else:
            print("✅ Found member details")
            member_details = schemas.Member(
                membership_status=member_data.membership_status,
            )

    company_info = None
    if db_user.company:
        print("🏢 Company attached:", db_user.company.name)
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