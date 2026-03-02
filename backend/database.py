# import os
#
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker
# from sqlalchemy.ext.declarative import declarative_base
#
# from dotenv import load_dotenv
# load_dotenv()
#
# URL_DATABASE = os.getenv("DATABASE_URL")
#
# if not URL_DATABASE:
#     raise ValueError("DATABASE_URL is not set in environment variables.")
#
# engine = create_engine(URL_DATABASE)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# Base = declarative_base()
import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

from dotenv import load_dotenv

# Force-load .env from the backend folder, no matter where Python is run from
BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH, override=True)

URL_DATABASE = os.getenv("DATABASE_URL")

if not URL_DATABASE:
    raise ValueError("DATABASE_URL is not set in environment variables.")

engine = create_engine(URL_DATABASE)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()