from sqlalchemy import Column, Integer, Float,  String, CheckConstraint, ForeignKey, ARRAY, func, Boolean, Date, Time, DateTime, UniqueConstraint, Text, func
from sqlalchemy.orm import validates
from database import Base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import date, datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(50), nullable=False)
    surname = Column(String(50), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(10), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(100), unique=True, index=True, nullable=True)

    hashed_password = Column(String(255), nullable=False)
    role = Column(String(10), nullable=False)

    # Initiatives created by the user
    created_initiatives = relationship("Initiative", foreign_keys="Initiative.created_by", back_populates="creator")

    # Votes cast by the user
    votes = relationship("Vote", back_populates="user")

    # Progress entries
    progress_entries = relationship("UserProgress", back_populates="user")

    __table_args__ = (
        CheckConstraint(
            "role IN ('admin', 'member')", name="check_valid_roles"
        ),
        CheckConstraint(
            "gender IN ('male', 'female')", name="check_valid_genders"
        ),
    )

    @validates('age')
    def validate_age(self, key, value):
        """
        Validates that the age is between 0 and 120.
        """
        if not (0 <= value <= 120):
            raise ValueError("Age must be a positive integer between 0 and 120.")
        return value

    __mapper_args__ = {
        'polymorphic_identity': 'user',
        'polymorphic_on': role
    }

    # Relationship with post listings (one-to-many)
    posts = relationship("Post", back_populates="user")

    avatars = relationship("Avatar", back_populates="user", cascade="all, delete-orphan")

    # Relationship with favorite properties (one-to-many)
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")

    badges = relationship("UserBadge", back_populates="user", cascade="all, delete-orphan")

    # Events created by the user (trainers and admins)
    created_events = relationship("Event", back_populates="creator", cascade="all, delete-orphan")

    # Events booked by the user (members)
    booked_events = relationship("Booking", back_populates="user", cascade="all, delete-orphan")


    # New Foreign Key for Company
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)

    # Relationship with Company
    company = relationship("Company", back_populates="users")


class Member(User):
    __tablename__ = "members"
    id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    membership_status = Column(String(50), nullable=True)

    __mapper_args__ = {
        'polymorphic_identity': 'member',
    }


class Admin(User):
    __tablename__ = "admins"
    id = Column(Integer, ForeignKey("users.id"), primary_key=True)

    __mapper_args__ = {
        'polymorphic_identity': 'admin',
    }


class InteractiveQuestion(Base):
    __tablename__ = "interactive_questions"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)
    category = Column(String, nullable=False)
    input_type = Column(String, nullable=False)
    options = Column(String)  # For dropdowns
    next_question_id = Column(Integer, ForeignKey("interactive_questions.id"), nullable=True)  # Dynamic Flow


class UserAnswer(Base):
    __tablename__ = "user_answers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    question_id = Column(Integer, ForeignKey("interactive_questions.id"))
    answer = Column(String, nullable=False)


class CarbonFootprint(Base):
    __tablename__ = "carbon_footprint"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    total_footprint = Column(Float, nullable=False)
    details = Column(Text, nullable=True)  # Existing field
    created_at = Column(DateTime, server_default=func.now())

    # New fields for seasonal tracking
    season = Column(String(10), nullable=True)  # "Winter", "Spring", "Summer", "Fall"
    year = Column(Integer, nullable=True)

    # Add constraint to ensure season+year+user_id is unique when both are provided
    __table_args__ = (UniqueConstraint('user_id', 'season', 'year', name='unique_user_season_year'),)

# Post model
class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    tags = Column(ARRAY(String), nullable=True)
    status = Column(String(20), nullable=False, default="draft")  # 'published' or 'draft'
    created_at = Column(DateTime, server_default=func.now())

    # Foreign key to associate with the author
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationship with the user (many-to-one)
    user = relationship("User", back_populates="posts")

    # Relationship with images (one-to-many)
    images = relationship("Image", back_populates="post", cascade="all, delete-orphan")

    # Relationship with favorites (one-to-many)
    favorites = relationship("Favorite", back_populates="post", cascade="all, delete-orphan")

    # Relationship with comments (one-to-many)
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")


# Comment model
class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # Foreign key to associate with the post
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)

    # Foreign key to associate with the author (user)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationship with the post (many-to-one)
    post = relationship("Post", back_populates="comments")

    # Relationship with the user (many-to-one)
    user = relationship("User")

# Image model
class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String)
    upload_date = Column(DateTime, server_default=func.now())

    # Foreign key to associate with p
    post_id = Column(Integer, ForeignKey("posts.id"))

    # Relationship with the post (many-to-one)
    post = relationship("Post", back_populates="images")


class Avatar(Base):
    __tablename__ = "avatars"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String)
    upload_date = Column(DateTime, server_default=func.now())

    # Foreign key to associate with p
    user_id = Column(Integer, ForeignKey("users.id"))

    # Relationship with the post (many-to-one)
    user = relationship("User", back_populates="avatars")

# Favorite model
class Favorite(Base):
    __tablename__ = 'favorites'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    post_id = Column(Integer, ForeignKey('posts.id'), index=True)

    __table_args__ = (UniqueConstraint('user_id', 'post_id', name='unique_favorite'),)

    # Relationship with the user (many-to-one)
    user = relationship("User", back_populates="favorites")

    # Relationship with the post (many-to-one)
    post = relationship("Post", back_populates="favorites")


class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # e.g., "First 3 Posts"
    description = Column(String(255), nullable=True)

    # Relationship with UserBadge (many-to-many)
    users = relationship("UserBadge", back_populates="badge")


class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id"), nullable=False)

    user = relationship("User", back_populates="badges")
    badge = relationship("Badge", back_populates="users")




class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(String, nullable=True)
    date = Column(Date)
    time = Column(Time)
    duration = Column(Integer)
    event_type = Column(String)
    is_personal_training = Column(Boolean, default=False)  # True for personal training sessions

    max_participants = Column(Integer, nullable=True)  # For group events only
    room_number = Column(String, nullable=True)  # For group events only

    # User who created the event (trainer or admin)
    creator_id = Column(Integer, ForeignKey("users.id"))
    creator = relationship("User", back_populates="created_events")

    # Participants (for public group events)
    bookings = relationship("Booking", back_populates="event", cascade="all, delete-orphan")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))  # User who booked the event
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"))

    # Relationships
    user = relationship("User", back_populates="booked_events")
    event = relationship("Event", back_populates="bookings")


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    industry = Column(String(100), nullable=False)
    domain = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # Relationship with users
    users = relationship("User", back_populates="company")

    def __repr__(self):
        return f"<Company(name={self.name}, industry={self.industry}, domain={self.domain})>"

# Update the Initiative model in models.py to include new fields and statuses
class Initiative(Base):
    __tablename__ = "initiatives"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    # Update status options: pending, active, completed, failed, archived
    status = Column(String, nullable=False, default="pending")
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)

    # New fields for automatic management
    voting_end_date = Column(DateTime, nullable=True)
    auto_delete_date = Column(DateTime, nullable=True)
    is_locked = Column(Boolean, default=False)  # To prevent changes when auto-activated

    # Relationships
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_initiatives")
    company = relationship("Company")
    votes = relationship("Vote", back_populates="initiative", cascade="all, delete-orphan")
    progress_entries = relationship("UserProgress", back_populates="initiative", cascade="all, delete-orphan")


class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    initiative_id = Column(Integer, ForeignKey("initiatives.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # Ensure a user can only vote once per initiative
    __table_args__ = (UniqueConstraint('user_id', 'initiative_id', name='unique_user_initiative_vote'),)

    # Relationships
    user = relationship("User")
    initiative = relationship("Initiative", back_populates="votes")


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    initiative_id = Column(Integer, ForeignKey("initiatives.id"), nullable=False)
    progress = Column(Integer, nullable=False, default=0)  # 0-100 percentage
    completed = Column(Boolean, nullable=False, default=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Ensure a user has only one progress entry per initiative
    __table_args__ = (UniqueConstraint('user_id', 'initiative_id', name='unique_user_initiative_progress'),)

    # Relationships
    user = relationship("User")
    initiative = relationship("Initiative", back_populates="progress_entries")

class Reward(Base):
    __tablename__ = "rewards"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String)  # e.g. "day_off"
    status = Column(String, default="issued")  # "issued", "redeemed"
    qr_code = Column(Text)  # base64 image or a code string
    issued_at = Column(DateTime, default=datetime.utcnow)
    redeemed_at = Column(DateTime, nullable=True)

