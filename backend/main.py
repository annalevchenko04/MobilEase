import os
import base64
import crud
import models
import schemas
from fastapi import FastAPI, HTTPException, Depends, status, File, Form, UploadFile
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import json

from database import engine, SessionLocal
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated, List, Dict, Union
from dotenv import load_dotenv
from pydantic import BaseModel
from calculator import calculate_footprint, emission_factors
import logging
from typing import Optional, List
from fastapi.responses import JSONResponse

load_dotenv()

app = FastAPI()

app.mount("/images", StaticFiles(directory="images"), name="images")

# Create a directory to store uploaded images if it doesn't exist
os.makedirs("images", exist_ok=True)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
logging.basicConfig(level=logging.DEBUG)

logging.basicConfig(level=logging.DEBUG)

origins = [
    "http://localhost:3000",
    "https://delightful-beach-0027ec603.6.azurestaticapps.net",
    "https://quickchart.io"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get("SECRET_KEY")
ALGORITHM = os.environ.get("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = 30
SENDGRIDAPIKEY = os.environ.get("SENDGRID_API_KEY")
REFRESH_TOKEN_EXPIRE_DAYS = 10

db_dependency = Annotated[Session, Depends(get_db)]



from fastapi import Query
from calculator import calculate_footprint, generate_seasonal_recommendations



class CarbonFootprintRequest(BaseModel):
    answers: Dict[str, Union[str, float, int]]


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    logging.info(f"Incoming Token: {token}")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logging.info(f"Decoded Token Payload: {payload}")
        user_id: int = payload.get("id")
        username: str = payload.get("username")
        role: str = payload.get("role")
        if user_id is None or username is None or role is None:
            raise credentials_exception

        # Ensure user_id is an integer
        user_id = int(user_id)

    except (JWTError, ValueError):
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
    logging.info(f"Database User Found: {user}")
    if user is None:
        raise credentials_exception
    return user

@app.post("/footprint")
def calculate_footprint_api(
        data: CarbonFootprintRequest,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    logging.info(f"Incoming Token Data: {current_user}")
    logging.info(f"Answers Received: {data.answers}")

    # # 🔎 Log the questions before calculation
    # logging.info("=== Questions Loaded for Calculation ===")
    # for question in questions:
    #     logging.info(f"ID: {question['id']} | Text: {question['text']} | Type: {question['type']}")
    try:
        result = calculate_footprint(data.answers)
        logging.info(f"Calculation Result: {result}")
        logging.info(f"Numeric Data: {result['unified_data']['numeric_data']}")

        saved_footprint = crud.save_carbon_footprint(
            db,
            user_id=current_user.id,
            total_footprint=result['total_carbon_footprint_kg'],
            details=result['unified_data'],
            category_breakdown=result['category_breakdown']
        )

        return {
            "total_carbon_footprint_kg": result['total_carbon_footprint_kg'],
            "category_breakdown": result['category_breakdown'],
            "recommendations": [
                "Reduce car usage and consider public transport.",
                "Switch to energy-efficient appliances to reduce electricity use.",
                "Consider reducing red meat consumption for lower food emissions."
            ],
            "saved_footprint": saved_footprint
        }
    except Exception as e:
        logging.error(f"Error in calculation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error calculating footprint: {str(e)}")


default_values = {
    "petrol_car": 200,       # km/month (EU average)
    "diesel_car": 180,
    "electricity": 300,      # kWh/month
    "water_usage": 10,       # cubic meters/month
}

# Emission factors from the image
emission_factors = {
    "car": 0.1949,
    "motorbike": 0.11662,
    "train": 0.04678,
    "bus": 0.12259,
    "flight_economy": 0.08378,
    "flight_first_class": 0.12565,
    "taxi": 0.21863,
    "emails": 0.004,
    "emails_with_attachments": 0.05,
    "spam_emails": 0.00003,
    "sms": 0.000014,
    "phone_calls": 0.19,
    "water_usage": 1.052,
    "electricity": 0.39,
    "heating": 0.215,
    "gas": 2.09672,
    "petrol_car": 0.1949,
    "diesel_car": 0.171,
    "cng_car": 0.165,
    "paper_waste": 0.5,
    "plastic_waste": 1.5,
    "glass_waste": 0.2,
    "general_waste": 2.0
}

mapping_corrections = {
    "petrol_car": "car",
    "diesel_car": "car",
    "cng_car": "car",
    "flight_economy": "flight_economy",
    "flight_first_class": "flight_first_class"
}

@app.get("/get_footprint")
def get_footprint_api(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    footprint = db.query(models.CarbonFootprint) \
        .filter(models.CarbonFootprint.user_id == current_user.id) \
        .order_by(models.CarbonFootprint.id.desc()) \
        .first()
    if not footprint:
        raise HTTPException(status_code=404, detail="No footprint record found")
    details = json.loads(footprint.details)
    return {
        "total_carbon_footprint_kg": footprint.total_footprint,
        "details": details
    }


@app.get("/user/{username}", response_model=schemas.UserResponse, tags=["Users"])
async def get_user_by_username(username: str, db: db_dependency):
    db_user = crud.get_user(db=db, username=username)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@app.get("/user/id/{userid}/", response_model=schemas.UserResponse, tags=["Users"])
async def get_user_by_id(userid: int, db: db_dependency):
    db_user = crud.get_user_by_id(db=db, userid=userid)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@app.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED, tags=["Users"])
async def register_user(user: schemas.UserCreate, db: db_dependency):
    db_user = crud.get_user(db=db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="User already exists")
    return crud.create_user(db=db, user=user)


def authenticate_user(username: str, password: str, db: db_dependency):
    user = crud.get_user(db=db, username=username)

    db_user = db.query(models.User).filter(models.User.username == username).first()

    # If user is not found, return None
    if not db_user:
        return False
    if not user or not pwd_context.verify(password, db_user.hashed_password):
        return False
    return user


def create_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({'exp': expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@app.post("/token", tags=["Users"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"})
    token_data = {"id": user.id, "username": user.username, "role": user.role}
    access_token = create_token(data=token_data, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer"}


def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("username")
        if username is None:
            raise HTTPException(status_code=403, detail="Token is invalid")
        return payload
    except JWTError:
        raise HTTPException(status_code=403, detail="Token is invalid")


@app.get("/verify-token/{token}", tags=["Users"])
async def verify_user_token(token: str, db: Session = Depends(get_db)):
    payload = verify_token(token=token)
    username = payload.get("username")
    user = crud.get_user(db, username=username)

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "Token is valid", "access_token": token}


@app.post("/refresh-token", tags=["Users"])
async def refresh_access_token(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("id")
        username: str = payload.get("username")
        role: str = payload.get("role")
        if user_id is None or username is None or role is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid refresh token")
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        access_token = create_token(
            {"id": user.id, "username": user.username, "role": user.role},
            timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))

        return {"access_token": access_token, "token_type": "bearer"}

    except JWTError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid refresh token")


@app.get("/users", response_model=List[schemas.UserResponse], tags=["Users"])
async def list_users(db: db_dependency):
    users = crud.get_users(db=db)
    return users








@app.get("/user/profile", response_model=schemas.UserResponse, tags=["Users"])
async def get_user_profile(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.get_user(db, current_user.username)

@app.get("/admin/company-employees")
def get_company_employees(
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user),
) -> List[dict]:
    """
    Returns a list of employees for the current admin user.
    Includes each employee's most recent total footprint.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access this.")

    employees = (
        db.query(models.User)
        .filter(models.User.company_id == current_user.company_id)
        .all()
    )

    user_list = []
        # Query the most recent carbon footprint entry for this user
        # If your CarbonFootprint model has a timestamp, you might order_by that descending.
        # Otherwise, order_by id descending to get the latest entry.
    for e in employees:
        latest_footprint = (
                db.query(models.CarbonFootprint)
                .filter(models.CarbonFootprint.user_id == e.id)
                .order_by(models.CarbonFootprint.id.desc())  # recommended to get the latest
                .first()
        )

        if latest_footprint:
                print(f"Employee {e.id} footprint value:", latest_footprint.total_footprint)
                total_footprint_value = latest_footprint.total_footprint
        else:
                print(f"Employee {e.id} has no footprint data.")
                total_footprint_value = None


        user_data = {
            "id": e.id,
            "username": e.username,
            "name": e.name,
            "surname": e.surname,
            "age": e.age,
            "gender": e.gender,
            "email": e.email,
            "phone": e.phone,
            "role": e.role,
            "total_footprint": total_footprint_value
        }
        user_list.append(user_data)

    return user_list


# Update a user
@app.put("/user/{user_id}", response_model=schemas.UserResponse, tags=["Users"])
async def update_user(user_id: int, user: schemas.UserCreate, db: db_dependency):
    db_user = crud.update_user(db, user_id, user)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


# Delete a user
@app.delete("/user/{user_id}", response_model=dict, tags=["Users"])
async def delete_user(user_id: int, db: db_dependency):
    result = crud.delete_user(db, user_id)
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}


@app.get("/user/id/{userid}/", response_model=schemas.UserResponse, tags=["Users"])
async def get_user_by_id(userid: int, db: db_dependency):
    db_user = crud.get_user_by_id(db=db, userid=userid)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@app.get("/user-id/{username}")
def get_user_id_route(username: str, db: Session = Depends(get_db)):
    user_id = crud.get_user_id(db, username)
    if user_id is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user_id": user_id}


# Read a single post by ID
@app.get("/post/{post_id}", response_model=schemas.Post)
async def read_post(post_id: int, db: Session = Depends(get_db)):
    db_post = crud.get_post(db=db, post_id=post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return db_post


# Get all posts
@app.get("/posts", response_model=List[schemas.Post])
async def list_posts(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_all_posts(db=db, skip=skip, limit=limit)


# Get all posts by a single user
@app.get("/users/{user_id}/myposts", response_model=List[schemas.Post])
async def list_user_posts(
        user_id: int,
        db: Session = Depends(get_db),
        token: str = Depends(oauth2_scheme)
):
    db_user = get_current_user(token, db)

    # Ensure the authenticated user matches the user_id in the path
    if db_user.id != user_id:
        raise HTTPException(status_code=403, detail="User ID in the URL does not match the authenticated user")

    # Fetch posts for the authenticated user
    return crud.get_posts_by_user(db=db, user_id=db_user.id)


@app.post("/users/{user_id}/post", response_model=schemas.Post)
async def create_post(
        user_id: int,
        post: schemas.PostCreate,
        db: db_dependency,
        token: str = Depends(oauth2_scheme)
):
    db_user = get_current_user(token, db)
    # Ensure the user exists, is a member, and matches the user_id in the path
    if db_user is None or db_user.role != "member" or db_user.id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized or incorrect user ID")

        # Create the post with the ID
    new_post = crud.create_post(db=db, post=post, user_id=db_user.id)

        # 🔹 Call the badge function after the post is created
    crud.check_and_assign_badge(db, user_id)

    return new_post


# Update a post (only who own the post)
@app.put("/users/{user_id}/post/{post_id}", response_model=schemas.Post)
async def update_post(
        user_id: int,
        post_id: int,
        post: schemas.PostCreate,
        db: Session = Depends(get_db),
        token: str = Depends(oauth2_scheme)
):
    db_user = get_current_user(token, db)

    # Verify user authorization
    if db_user is None or db_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this post")

    # Check if the post exists
    db_post = crud.get_post(db=db, post_id=post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    # Ensure the user is authorized to update the specific post (admins or owners only)
    if db_user.role != "admin" and db_post.user_id != db_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this post")

    # Update the post
    return crud.update_post(db=db, post_id=post_id, post_update=post)


# Delete a post (only who own the post or admins)
@app.delete("/users/{user_id}/post/{post_id}", response_model=dict)
async def delete_post(
        user_id: int,
        post_id: int,
        db: Session = Depends(get_db),
        token: str = Depends(oauth2_scheme)
):
    db_user = get_current_user(token, db)

    # Ensure the authenticated user matches the user_id in the path
    if db_user is None or db_user.id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized: Incorrect user ID")

    # Retrieve the post to check ownership
    db_post = crud.get_post(db=db, post_id=post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    # Authorization: Only the post owner or an admin can delete the post
    if db_user.role != "admin" and db_post.user_id != db_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    # Delete the post
    crud.delete_post(db=db, post_id=post_id)
    return {"message": "Post deleted successfully"}


# --- Image Endpoints for Posts ---

# Upload an image for a post
@app.post("/users/{user_id}/post/{post_id}/image", response_model=schemas.Image)
async def upload_image(
        user_id: int,
        post_id: int,
        image_file: UploadFile = File(None),  # Allow file upload
        image_data: str = Form(None),  # Allow base64 data as an alternative
        db: Session = Depends(get_db),
        token: str = Depends(oauth2_scheme)
):
    db_user = get_current_user(token, db)

    # Ensure authenticated user matches user_id
    if db_user is None or db_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to upload images for this user")

    # Verify that post exists and user is authorized
    db_post = crud.get_post(db=db, post_id=post_id)
    if db_post is None or db_post.user_id != db_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to upload images for this post")

    # Determine if image data is uploaded as a file or base64 string
    if image_file:
        # Handle file upload
        file_extension = image_file.filename.split(".")[-1]
        new_filename = f"{post_id}_{datetime.now().timestamp()}.{file_extension}"
        image_path = os.path.join("images", new_filename)
        with open(image_path, "wb") as file_io:
            content = await image_file.read()
            file_io.write(content)
    elif image_data:
        # Decode base64 and save
        file_extension = "png"  # Adjust extension if necessary
        new_filename = f"{post_id}_{datetime.now().timestamp()}.{file_extension}"
        image_path = os.path.join("images", new_filename)
        with open(image_path, "wb") as file_io:
            image_bytes = base64.b64decode(image_data.split(",")[1])  # Ignore base64 header
            file_io.write(image_bytes)
    else:
        raise HTTPException(status_code=400, detail="No image data provided")

    # Record the image in the database
    image_url = f"/images/{new_filename}".replace("\\", "/")  # ✅ Ensure forward slashes
    image_data = schemas.ImageCreate(filename=new_filename, url=image_url)

    return crud.create_image(db=db, image=image_data, post_id=post_id)


# Retrieve a specific image by ID for a post
@app.get("/post/{post_id}/image/{image_id}", response_model=schemas.Image)
async def read_image(post_id: int, image_id: int, db: Session = Depends(get_db)):
    db_image = crud.get_image(db=db, post_id=post_id, image_id=image_id)
    if db_image is None:
        raise HTTPException(status_code=404, detail="Image not found or does not belong to this post")
    return db_image  # Includes post_id in the response due to the Pydantic schema


# Get all images for a post
@app.get("/post/{post_id}/images", response_model=List[schemas.Image])
async def list_images_for_post(post_id: int, db: Session = Depends(get_db)):
    db_post = crud.get_post(db=db, post_id=post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    images = crud.get_images_by_post(db=db, post_id=post_id)

    # Map the images to their accessible URLs
    for image in images:
        image.url = f"/images/{os.path.basename(image.url)}".replace("\\", "/")  # Adjust the URL if necessary

    return images


# Delete an image by ID (only who own the post)
@app.delete("/users/{user_id}/post/{post_id}/image/{image_id}", response_model=dict)
async def delete_image(
        user_id: int,
        post_id: int,
        image_id: int,
        db: Session = Depends(get_db),
        token: str = Depends(oauth2_scheme)
):
    # Verify token and retrieve user information
    db_user = get_current_user(token, db)

    # Check if the user is authorized
    if db_user is None or db_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this image")

    # Retrieve the image by both image_id and post_id
    db_image = crud.get_image(db=db, post_id=post_id, image_id=image_id)
    if db_image is None:
        raise HTTPException(status_code=404, detail="Image not found or does not belong to the specified post")

    # Retrieve the post associated with this image
    db_post = crud.get_post(db=db, post_id=post_id)
    if db_post is None or db_post.user_id != db_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this image")

    # Perform the delete operation
    crud.delete_image(db=db, image_id=image_id)
    return {"message": "Image deleted successfully"}


@app.post("/users/{user_id}/avatar", response_model=schemas.Avatar)
async def upload_avatar(
        user_id: int,
        avatar_file: UploadFile = File(None),  # Allow file upload
        avatar_data: str = Form(None),  # Allow base64 data as an alternative
        db: Session = Depends(get_db),
        token: str = Depends(oauth2_scheme)
):
    db_user = get_current_user(token, db)

    # Ensure authenticated user matches user_id
    if db_user is None or db_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to upload images for this user")

    # Determine if image data is uploaded as a file or base64 string
    if avatar_file:
        # Handle file upload
        file_extension = avatar_file.filename.split(".")[-1]
        new_filename = f"{user_id}_{datetime.now().timestamp()}.{file_extension}"
        avatar_path = os.path.join("images", new_filename)
        with open(avatar_path, "wb") as file_io:
            content = await avatar_file.read()
            file_io.write(content)
    elif avatar_data:
        # Decode base64 and save
        file_extension = "png"  # Adjust extension if necessary
        new_filename = f"{user_id}_{datetime.now().timestamp()}.{file_extension}"
        avatar_path = os.path.join("images", new_filename)
        with open(avatar_path, "wb") as file_io:
            avatar_bytes = base64.b64decode(avatar_data.split(",")[1])  # Ignore base64 header
            file_io.write(avatar_bytes)
    else:
        raise HTTPException(status_code=400, detail="No avatar data provided")

    # Record the image in the database
    avatar_url = f"/images/{new_filename}".replace("\\", "/")  # ✅ Ensure forward slashes
    avatar_data = schemas.AvatarCreate(filename=new_filename, url=avatar_url)

    return crud.create_avatar(db=db, avatar=avatar_data, user_id=user_id)


# Retrieve a specific image by ID for a post
@app.get("/users/{user_id}/avatar", response_model=schemas.Avatar)
async def read_avatar(user_id: int, db: Session = Depends(get_db)):
    db_avatar = crud.get_avatar(db=db, user_id=user_id)
    if db_avatar is None:
        raise HTTPException(status_code=404, detail="Avatar not found or does not belong to this post")
    return db_avatar  # Includes post_id in the response due to the Pydantic schema


# Delete an image by ID (only who own the post)
@app.delete("/users/{user_id}/avatar/{avatar_id}", response_model=dict)
async def delete_avatar(
        user_id: int,
        avatar_id: int,
        db: Session = Depends(get_db),
        token: str = Depends(oauth2_scheme)
):
    # Verify token and retrieve user information
    db_user = get_current_user(token, db)

    # Check if the user is authorized
    if db_user is None or db_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this image")

    # Retrieve the image by both image_id and post_id
    db_avatar = crud.get_avatar(db=db, user_id=user_id)
    if db_avatar is None:
        raise HTTPException(status_code=404, detail="Avatar not found or does not belong to the specified post")

    # Perform the delete operation
    crud.delete_avatar(db=db, avatar_id=avatar_id)
    return {"message": "Avatar deleted successfully"}


# --- Favorite Endpoints for Posts ---

# Add a post to favorites
@app.post("/users/{user_id}/post/{post_id}/favorites", response_model=schemas.Favorite)
async def add_favorite(
        user_id: int,
        post_id: int,
        db: Session = Depends(get_db),
        token: str = Depends(oauth2_scheme)
):
    # Verify token and get user information
    db_user = get_current_user(token, db)

    # Ensure the user ID from token matches the user_id in the path
    if db_user is None or db_user.id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized: Incorrect user ID")

    # Add the post to favorites
    return crud.add_favorite(db, user_id, post_id)


# Remove a favorite post
@app.delete("/users/{user_id}/post/{post_id}/favorites")
async def remove_favorite(
        user_id: int,
        post_id: int,
        db: Session = Depends(get_db),
        token: str = Depends(oauth2_scheme)
):
    # Verify token and get user information
    db_user = get_current_user(token, db)

    # Ensure the user ID from token matches the user_id in the path
    if db_user is None or db_user.id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized: Incorrect user ID")

    # Remove the post from favorites
    crud.remove_favorite(db, user_id, post_id)
    return {"message": "Favorite removed successfully"}


# Get all favorite posts for a user
@app.get("/users/{user_id}/favorites", response_model=List[schemas.Post])
async def get_favorites(
        user_id: int,
        db: Session = Depends(get_db),
        token: str = Depends(oauth2_scheme)
):
    # Verify token and get user information
    db_user = get_current_user(token, db)

    # Ensure the user ID from token matches the user_id in the path
    if db_user is None or db_user.id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized: Incorrect user ID")

    # Retrieve all favorite posts for the user
    return crud.get_favorites(db, user_id)

# Endpoint to get the count of favorites for a post
@app.get("/posts/{post_id}/favorites/count")
async def get_favorite_count(post_id: int, db: Session = Depends(get_db)):
    favorite_count = crud.count_favorites(db, post_id)
    return {"favorite_count": favorite_count}


@app.get("/users/{user_id}/badges", response_model=List[schemas.BadgeResponse])
async def get_user_badges_route(user_id: int, db: Session = Depends(get_db)):
    user_badges = crud.get_user_badges(db, user_id)
    return user_badges



# Event Endpoints
@app.post("/event", response_model=schemas.Event, status_code=status.HTTP_201_CREATED)
async def create_event(event: schemas.EventCreate, db: db_dependency,
                       current_user: models.User = Depends(get_current_user)):
    return crud.create_event(db=db, event=event, user_id=current_user.id)


@app.get("/events", response_model=List[schemas.Event])
async def list_events(db: db_dependency, current_user: models.User = Depends(get_current_user)):
    return crud.get_events(db=db, user_id=current_user.id)


@app.put("/event/{event_id}", response_model=schemas.Event)
async def update_event(event_id: int, event: schemas.EventCreate, db: db_dependency,
                       current_user: models.User = Depends(get_current_user)):
    updated_event = crud.update_event(db, event_id, event, current_user.id)
    if updated_event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return updated_event


@app.delete("/event/{event_id}", response_model=dict)
async def delete_event(event_id: int, db: db_dependency, current_user: models.User = Depends(get_current_user)):
    result = crud.delete_event(db, event_id, current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="Event not found or permission denied")
    return {"message": "Event deleted successfully"}


# Booking Endpoints
@app.post("/events/{event_id}/book", response_model=schemas.Booking, status_code=status.HTTP_201_CREATED)
async def book_event(event_id: int, db: db_dependency, current_user: models.User = Depends(get_current_user)):
    return crud.book_event(db=db, event_id=event_id, user_id=current_user.id)


@app.delete("/bookings/{booking_id}", response_model=dict)
async def cancel_booking(booking_id: int, db: db_dependency):
    result = crud.cancel_booking(db, booking_id)
    if not result:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"message": "Booking cancelled successfully"}




# Fetch bookings for the current user
@app.get("/bookings", response_model=List[schemas.Booking])
async def fetch_bookings(db: db_dependency, current_user: models.User = Depends(get_current_user)):
    bookings = crud.get_bookings_by_user(db=db, user_id=current_user.id)
    return bookings


# Fetch bookings for a specific event
@app.get("/events/{event_id}/bookings", response_model=List[schemas.Booking])
async def fetch_event_bookings(event_id: int, db: db_dependency, current_user: models.User = Depends(get_current_user)):
    bookings = crud.get_bookings_by_event(db=db, event_id=event_id)
    return bookings


class RegisterCompanyRequest(BaseModel):
    company_data: schemas.CompanyCreate
    user_data: schemas.UserCreate

@app.post("/register-company/", response_model=schemas.UserResponse)
def register_company(
    request: RegisterCompanyRequest, db: Session = Depends(get_db)
):
    return crud.create_company(db, request.company_data, request.user_data)




@app.post("/comments/", response_model=schemas.Comment)
def create_comment(comment_data: schemas.CommentCreate, db: Session = Depends(get_db)):
    return crud.create_comment(db, comment_data)

@app.get("/comments/{comment_id}", response_model=schemas.Comment)
def read_comment(comment_id: int, db: Session = Depends(get_db)):
    return crud.get_comment(db, comment_id)

@app.get("/comments/post/{post_id}", response_model=list[schemas.Comment])
def read_comments_by_post(post_id: int, db: Session = Depends(get_db)):
    return crud.get_comments_by_post(db, post_id)

@app.get("/comments/user/{user_id}", response_model=list[schemas.Comment])
def read_comments_by_user(user_id: int, db: Session = Depends(get_db)):
    return crud.get_comments_by_user(db, user_id)

@app.put("/comments/{comment_id}", response_model=schemas.Comment)
def update_comment_endpoint(comment_id: int, comment_update: schemas.CommentBase, db: Session = Depends(get_db)):
    return crud.update_comment(db, comment_id, comment_update)

@app.delete("/comments/{comment_id}")
def delete_comment_endpoint(comment_id: int, db: Session = Depends(get_db)):
    if crud.delete_comment(db, comment_id):
        return {"detail": "Comment deleted successfully"}
    raise HTTPException(status_code=400, detail="Failed to delete comment")


# Add this validation to your /initiatives/ POST endpoint in main.py:

@app.post("/initiatives/", response_model=schemas.Initiative, status_code=status.HTTP_201_CREATED)
def create_initiative_endpoint(
        initiative: schemas.InitiativeCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    # First check if the user can suggest an initiative
    suggestion_status = can_suggest_initiative(db, current_user)

    if not suggestion_status["can_suggest"]:
        raise HTTPException(
            status_code=400,
            detail="You cannot suggest an initiative at this time."
        )

    # Ensure month/year match what's allowed
    if suggestion_status["target_month"] != initiative.month or suggestion_status["target_year"] != initiative.year:
        raise HTTPException(
            status_code=400,
            detail=f"You can only suggest initiatives in the last week of current month, for the next month."
        )

    # Create the initiative
    return crud.create_initiative(db, initiative, current_user.id, current_user.company_id)


# Update the API endpoint in main.py
@app.get("/initiatives/", response_model=List[schemas.Initiative])
def list_initiatives(
        status: Optional[str] = None,
        month: Optional[int] = None,
        year: Optional[int] = None,
        include_archived: bool = False,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    initiatives = crud.get_initiatives(
        db,
        current_user.company_id,
        status,
        month,
        year,
        include_archived
    )

    # Add vote count to each initiative
    for initiative in initiatives:
        vote_count = len(initiative.votes)
        initiative.vote_count = vote_count

    return initiatives


@app.get("/initiatives/{initiative_id}", response_model=schemas.Initiative)
def get_initiative_endpoint(
        initiative_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    initiative = crud.get_initiative(db, initiative_id)
    if not initiative:
        raise HTTPException(status_code=404, detail="Initiative not found")

    # Check if user belongs to the same company as the initiative
    if initiative.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this initiative")

    # Add vote count
    initiative.vote_count = len(initiative.votes)
    return initiative


@app.put("/initiatives/{initiative_id}", response_model=schemas.Initiative)
def update_initiative_endpoint(
        initiative_id: int,
        initiative: schemas.InitiativeCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    db_initiative = crud.get_initiative(db, initiative_id)
    if not db_initiative:
        raise HTTPException(status_code=404, detail="Initiative not found")

    # Check if user is the creator or an admin
    if db_initiative.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this initiative")

    updated_initiative = crud.update_initiative(db, initiative_id, initiative)
    return updated_initiative


@app.delete("/initiatives/{initiative_id}", response_model=dict)
def delete_initiative_endpoint(
        initiative_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    db_initiative = crud.get_initiative(db, initiative_id)
    if not db_initiative:
        raise HTTPException(status_code=404, detail="Initiative not found")

    # Check if user is the creator or an admin
    if db_initiative.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this initiative")

    crud.delete_initiative(db, initiative_id)
    return {"message": "Initiative deleted successfully"}


@app.post("/initiatives/{initiative_id}/vote", response_model=schemas.Vote)
def vote_for_initiative(
        initiative_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    initiative = crud.get_initiative(db, initiative_id)
    if not initiative:
        raise HTTPException(status_code=404, detail="Initiative not found")

    # Check if initiative is still pending (voting period)
    if initiative.status != "pending":
        raise HTTPException(status_code=400, detail="Voting is only allowed for pending initiatives")

    # Check if user belongs to the same company as the initiative
    if initiative.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to vote for this initiative")

    return crud.create_vote(db, current_user.id, initiative_id)


@app.delete("/initiatives/{initiative_id}/vote", response_model=dict)
def remove_vote(
        initiative_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    initiative = crud.get_initiative(db, initiative_id)
    if not initiative:
        raise HTTPException(status_code=404, detail="Initiative not found")

    # Check if initiative is still pending (voting period)
    if initiative.status != "pending":
        raise HTTPException(status_code=400, detail="Vote removal is only allowed for pending initiatives")

    result = crud.delete_vote(db, current_user.id, initiative_id)
    if result:
        return {"message": "Vote removed successfully"}
    raise HTTPException(status_code=404, detail="Vote not found")


@app.get("/initiatives/{initiative_id}/votes", response_model=List[schemas.Vote])
def get_initiative_votes(
        initiative_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    initiative = crud.get_initiative(db, initiative_id)
    if not initiative:
        raise HTTPException(status_code=404, detail="Initiative not found")

    # Check if user belongs to the same company as the initiative
    if initiative.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to view votes for this initiative")

    return crud.get_votes_by_initiative(db, initiative_id)


@app.get("/initiatives/voting-results/{month}/{year}", response_model=List[dict])
def get_voting_results_endpoint(
        month: int,
        year: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Invalid month")

    return crud.get_voting_results(db, current_user.company_id, month, year)


@app.post("/initiatives/activate/{initiative_id}", response_model=schemas.Initiative)
def activate_initiative_endpoint(
        initiative_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    # Only admins can activate initiatives
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can activate initiatives")

    initiative = crud.get_initiative(db, initiative_id)
    if not initiative:
        raise HTTPException(status_code=404, detail="Initiative not found")

    # Check if initiative belongs to the admin's company
    if initiative.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to activate this initiative")

    activated_initiative = crud.activate_initiative(db, initiative_id)
    return activated_initiative


@app.get("/initiatives/active")
def get_active_initiative_endpoint(
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    """Get the currently active initiative for the user's company."""
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User is not associated with a company")

    initiative = crud.get_active_initiative(db, current_user.company_id)
    if not initiative:
        raise HTTPException(status_code=404, detail="No active initiative found")

    # Convert SQLAlchemy model to dictionary
    # This approach ensures we're grabbing exactly the fields we need
    response_data = {
        "id": initiative.id,
        "title": initiative.title,
        "description": initiative.description,
        "created_by": initiative.created_by,
        "created_at": initiative.created_at.isoformat(),  # Convert datetime to string
        "status": initiative.status,
        "month": initiative.month,
        "year": initiative.year,
        "company_id": initiative.company_id,
        "vote_count": len(initiative.votes) if hasattr(initiative, 'votes') else 0,
        "is_locked": initiative.is_locked if hasattr(initiative, 'is_locked') else False,
    }

    # Handle optional fields that might cause serialization issues
    if hasattr(initiative, 'voting_end_date') and initiative.voting_end_date:
        response_data["voting_end_date"] = initiative.voting_end_date.isoformat()
    else:
        response_data["voting_end_date"] = None

    if hasattr(initiative, 'auto_delete_date') and initiative.auto_delete_date:
        response_data["auto_delete_date"] = initiative.auto_delete_date.isoformat()
    else:
        response_data["auto_delete_date"] = None

    # Return as a JSONResponse instead of direct dict return
    return JSONResponse(content=response_data)


# Progress endpoints
@app.post("/progress/", response_model=schemas.Progress)
def create_or_update_progress_endpoint(
        progress: schemas.ProgressCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    # Validate the initiative exists and is active
    initiative = crud.get_initiative(db, progress.initiative_id)
    if not initiative:
        raise HTTPException(status_code=404, detail="Initiative not found")

    if initiative.status != "active":
        raise HTTPException(status_code=400, detail="Progress can only be updated for active initiatives")

    # Check if user belongs to the same company as the initiative
    if initiative.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to update progress for this initiative")

    # Validate progress percentage
    if progress.progress < 0 or progress.progress > 100:
        raise HTTPException(status_code=400, detail="Progress must be between 0 and 100")

    # If the progress is complete (100%), award a badge
    if progress.progress == 9:
        crud.award_initiative_completion_badge(db, current_user.id)

    return crud.create_or_update_progress(db, current_user.id, progress)


@app.get("/progress/", response_model=List[schemas.Progress])
def get_user_progress_endpoint(
        initiative_id: Optional[int] = None,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    return crud.get_user_progress(db, current_user.id, initiative_id)


@app.get("/initiatives/{initiative_id}/progress", response_model=List[schemas.Progress])
def get_company_progress_endpoint(
        initiative_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    # Only admins can view company-wide progress
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view company-wide progress")

    initiative = crud.get_initiative(db, initiative_id)
    if not initiative:
        raise HTTPException(status_code=404, detail="Initiative not found")

    # Check if initiative belongs to the admin's company
    if initiative.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to view progress for this initiative")

    return crud.get_company_progress(db, current_user.company_id, initiative_id)


# Check if user can suggest an initiative for next month
# Update can_suggest_initiative function to give admins special privileges
@app.get("/initiatives/can-suggest", response_model=dict)
def can_suggest_initiative(
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    """Check if a user can suggest a new initiative."""
    try:
        # Admins can always suggest initiatives for the current month
        if current_user.role == "admin":
            current_date = datetime.now()
            current_month = current_date.month
            current_year = current_date.year

            # Admins can always suggest for the current month
            return {
                "can_suggest": True,
                "target_month": current_month,
                "target_year": current_year,
                "is_admin": True
            }

        # For regular users, continue with the existing logic
        # Get current date information
        current_date = datetime.now()
        current_month = current_date.month
        current_year = current_date.year

        # Get next month/year
        next_month = current_month + 1 if current_month < 12 else 1
        next_year = current_year if current_month < 12 else current_year + 1

        # Calculate days until next month
        last_day_of_month = 28
        if current_month in [1, 3, 5, 7, 8, 10, 12]:  # 31-day months
            last_day_of_month = 31
        elif current_month in [4, 6, 9, 11]:  # 30-day months
            last_day_of_month = 30
        elif current_month == 2:  # February
            last_day_of_month = 29 if (
                        (current_year % 4 == 0 and current_year % 100 != 0) or current_year % 400 == 0) else 28

        days_until_next_month = last_day_of_month - current_date.day + 1

        # Check if there's an active initiative for the current month
        active_initiative = db.query(models.Initiative).filter(
            models.Initiative.company_id == current_user.company_id,
            models.Initiative.status == "active",
            models.Initiative.month == current_month,
            models.Initiative.year == current_year
        ).first()

        # Regular users can suggest for next month if we're in the last 7 days
        can_suggest_next_month = days_until_next_month <= 7
        # Only suggest for current month if no active initiative exists
        can_suggest_current_month = not active_initiative

        # Check if user already has a pending initiative for relevant months
        has_current_month_initiative = db.query(models.Initiative).filter(
            models.Initiative.created_by == current_user.id,
            models.Initiative.month == current_month,
            models.Initiative.year == current_year,
            models.Initiative.status.in_(["pending", "active"])
        ).first() is not None

        has_next_month_initiative = db.query(models.Initiative).filter(
            models.Initiative.created_by == current_user.id,
            models.Initiative.month == next_month,
            models.Initiative.year == next_year,
            models.Initiative.status.in_(["pending", "active"])
        ).first() is not None

        # Determine what the user can do
        if can_suggest_next_month and not has_next_month_initiative:
            target_month = next_month
            target_year = next_year
            can_suggest = True
        elif can_suggest_current_month and not has_current_month_initiative:
            target_month = current_month
            target_year = current_year
            can_suggest = True
        else:
            can_suggest = False
            target_month = next_month if can_suggest_next_month else current_month
            target_year = next_year if can_suggest_next_month and current_month == 12 else current_year

        return {
            "can_suggest": can_suggest,
            "target_month": target_month,
            "target_year": target_year,
            "days_until_next_month": days_until_next_month,
            "has_active_initiative": active_initiative is not None
        }

    except Exception as e:
        # Log the error for debugging
        print(f"Error in can_suggest_initiative: {str(e)}")
        # Return a default response
        return {
            "can_suggest": False,
            "error": str(e),
            "reason": "An error occurred checking initiative suggestion status"
        }

# Modified POST endpoint with additional checks
@app.post("/initiatives/", response_model=schemas.Initiative, status_code=status.HTTP_201_CREATED)
def create_initiative_endpoint(
        initiative: schemas.InitiativeCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    # Check if user already has a pending initiative for this month/year
    has_pending = crud.check_user_has_pending_initiative(db, current_user.id)
    if has_pending:
        raise HTTPException(
            status_code=400,
            detail="You have already submitted an initiative for the next month."
        )

    # Enforce next month requirement
    current_date = datetime.now()
    next_month_date = current_date.replace(day=1) + timedelta(days=32)
    next_month = next_month_date.month
    next_year = next_month_date.year

    if initiative.month != next_month or initiative.year != next_year:
        raise HTTPException(
            status_code=400,
            detail=f"Initiatives must be submitted for the next month ({next_month}/{next_year})."
        )

    return crud.create_initiative(db, initiative, current_user.id, current_user.company_id)


# Admin endpoint to deactivate initiative and start voting
@app.post("/initiatives/", response_model=schemas.Initiative, status_code=status.HTTP_201_CREATED)
def create_initiative_endpoint(
        initiative: schemas.InitiativeCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    # Check if user already has a pending initiative for this month/year
    if current_user.role != "admin":  # Skip this check for admins
        has_pending = crud.check_user_has_pending_initiative(db, current_user.id)
        if has_pending:
            raise HTTPException(
                status_code=400,
                detail="You have already submitted an initiative for the upcoming month."
            )

    # For regular users, enforce next month requirement
    # For admins, allow current or next month
    current_date = datetime.now()
    next_month_date = current_date.replace(day=1) + timedelta(days=32)
    next_month = next_month_date.month
    next_year = next_month_date.year

    if current_user.role != "admin":  # Only enforce for non-admins
        if initiative.month != next_month or initiative.year != next_year:
            raise HTTPException(
                status_code=400,
                detail=f"Initiatives must be submitted for the next month ({next_month}/{next_year})."
            )
    else:
        # For admins, allow current month or next month
        current_month = current_date.month
        current_year = current_date.year
        valid_months = [(current_month, current_year), (next_month, next_year)]

        if (initiative.month, initiative.year) not in valid_months:
            raise HTTPException(
                status_code=400,
                detail=f"Initiatives can only be created for the current month ({current_month}/{current_year}) or next month ({next_month}/{next_year})."
            )

    return crud.create_initiative(db, initiative, current_user.id, current_user.company_id)

# Run scheduled tasks (this would normally be run by a scheduler like Celery)
@app.post("/admin/run-scheduled-tasks", response_model=dict)
def run_scheduled_tasks(
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    # Only admins can manually run scheduled tasks
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can run scheduled tasks")

    # Check for expired voting periods
    crud.check_expired_voting_periods(db)

    # Check for monthly auto-activation
    crud.check_monthly_auto_activation(db)

    # Cleanup failed initiatives
    deleted_count = crud.cleanup_failed_initiatives(db)

    return {
        "message": "Scheduled tasks completed",
        "deleted_initiatives": deleted_count
    }

@app.get("/api/rewards/day-off", response_model=schemas.DayOffRewardResponse)
def get_day_off_reward(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Try to get "issued" reward first
    issued_reward = db.query(models.Reward).filter_by(user_id=current_user.id, type="day_off", status="issued").first()
    if issued_reward:
        return {
            "status": issued_reward.status,
            "qr_code": issued_reward.qr_code
        }

    # Then check for "redeemed"
    redeemed_reward = db.query(models.Reward).filter_by(user_id=current_user.id, type="day_off", status="redeemed").first()
    if redeemed_reward:
        return {
            "status": redeemed_reward.status,
            "qr_code": None
        }

    # Otherwise, return "not_earned"
    return {
        "status": "not_earned",
        "qr_code": None
    }


def get_current_admin(user: models.User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return user

@app.post("/api/admin/rewards/redeem/{user_id}")
def admin_redeem_day_off_reward(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    reward = db.query(models.Reward).filter_by(user_id=user_id, type="day_off", status="issued").first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found or already redeemed")

    reward.status = "redeemed"
    reward.redeemed_at = datetime.utcnow()
    db.commit()

    return {"message": "Reward redeemed successfully by admin"}


@app.delete("/api/admin/reset-progress/{user_id}")
def reset_user_progress(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    db.query(models.UserBadge).filter(models.UserBadge.user_id == user_id).delete()
    # db.query(models.Reward).filter(models.Reward.user_id == user_id, models.Reward.type == "day_off").delete()
    db.commit()
    return {"message": "User progress reset successfully"}


@app.get("/company/footprint-stats")
def get_company_footprint_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User does not belong to a company")

    print(f"🔍 Current user: {current_user.id}, company_id: {current_user.company_id}")

    users = db.query(models.User).filter(models.User.company_id == current_user.company_id).all()

    footprint_list = []
    your_footprint = None

    for user in users:
        latest = db.query(models.CarbonFootprint) \
                   .filter(models.CarbonFootprint.user_id == user.id) \
                   .order_by(models.CarbonFootprint.created_at.desc()) \
                   .first()

        print(f"🧾 User {user.id} -> footprint: {latest.total_footprint if latest else 'None'}")

        if latest:
            footprint_list.append((user.id, latest.total_footprint))
            if user.id == current_user.id:
                your_footprint = latest.total_footprint

    if not footprint_list:
        raise HTTPException(status_code=404, detail="No footprint data found for your company")

    values_only = [fp for _, fp in footprint_list]

    return {
        "average": sum(values_only) / len(values_only),
        "maximum": max(values_only),
        "your_footprint": your_footprint
    }

@app.get("/category-breakdown")
def get_category_breakdown(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    footprint = db.query(models.CarbonFootprint) \
                  .filter(models.CarbonFootprint.user_id == current_user.id) \
                  .order_by(models.CarbonFootprint.created_at.desc()) \
                  .first()
    if not footprint:
        raise HTTPException(status_code=404, detail="No footprint data found")

    details = json.loads(footprint.details)

    answers = {**details.get("numeric_data", {}), **details.get("non_numeric_data", {})}
    result = calculate_footprint(answers)

    return {"category_breakdown": result["category_breakdown"]}

@app.get("/footprint/history")
def get_footprint_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    entries = crud.get_footprint_history(db, current_user.id)
    return [
        {
            "timestamp": entry.created_at.isoformat(),
            "value": entry.total_footprint
        }
        for entry in entries
    ]



@app.get("/api/admin/rewards")
def get_all_rewards(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # ✅ Filter only users from the same company as the current admin
    users = db.query(models.User).filter(models.User.company_id == current_user.company_id).all()

    results = []

    for user in users:
        rewards = (
            db.query(models.Reward)
            .filter_by(user_id=user.id, type="day_off")
            .order_by(models.Reward.issued_at.desc())
            .all()
        )

        reward_list = []
        for reward in rewards:
            reward_list.append({
                "reward_id": reward.id,
                "status": reward.status,
                "qr_code": reward.qr_code if reward.status == "issued" else None,
                "issued_at": reward.issued_at.isoformat(),
                "redeemed_at": reward.redeemed_at.isoformat() if reward.redeemed_at else None
            })

        results.append({
            "user_id": user.id,
            "name": user.name,
            "surname": user.surname,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "rewards": reward_list if reward_list else [],
        })

    return results


@app.post("/initiatives/", response_model=schemas.Initiative, status_code=status.HTTP_201_CREATED)
def create_initiative_endpoint(
        initiative: schemas.InitiativeCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    # Get the suggestion status to validate
    suggestion_status = can_suggest_initiative(db, current_user)

    if not suggestion_status["can_suggest"]:
        raise HTTPException(
            status_code=400,
            detail="You cannot suggest an initiative at this time."
        )

    # Ensure month/year match what's allowed
    if suggestion_status["target_month"] != initiative.month or suggestion_status["target_year"] != initiative.year:
        raise HTTPException(
            status_code=400,
            detail=f"You can only suggest initiatives in the last week of current month, for the next month."
        )

    return crud.create_initiative(db, initiative, current_user.id, current_user.company_id)



@app.post("/initiatives/{initiative_id}/deactivate", response_model=dict)
def deactivate_initiative_endpoint(
        initiative_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    # Only admins can deactivate initiatives
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can deactivate initiatives")

    initiative = crud.get_initiative(db, initiative_id)
    if not initiative:
        raise HTTPException(status_code=404, detail="Initiative not found")

    # Check if it belongs to admin's company
    if initiative.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to deactivate this initiative")

    # Check if it's locked
    if initiative.is_locked:
        raise HTTPException(status_code=400, detail="Cannot deactivate a locked initiative")

    voting_end_date = crud.deactivate_initiative(db, initiative_id)
    if not voting_end_date:
        raise HTTPException(status_code=400, detail="Failed to deactivate initiative")

    return {
        "message": "Initiative deactivated. A 3-day voting period has started.",
        "voting_end_date": voting_end_date
    }
