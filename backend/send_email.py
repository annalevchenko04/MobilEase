import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDER_EMAIL = "andrid1@ktu.lt"  # Change to your verified SendGrid sender email


def send_welcome_email(to_email: str, name: str):
    message = Mail(
        from_email=SENDER_EMAIL,
        to_emails=to_email,
        subject="Welcome to the Employee Sustainability Portal!",
        html_content=open("email_template.html").read().replace("{name}", name)
    )
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"Email sent to {to_email}. Status code: {response.status_code}")
    except Exception as e:
        raise e
