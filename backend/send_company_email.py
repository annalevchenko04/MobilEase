import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from dotenv import load_dotenv

load_dotenv()  # Load environment variables

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDER_EMAIL = "andrid1@ktu.lt"  # Change to your verified sender email

def send_company_registration_email(company_name: str, admin_email: str):
    with open("company_email_template.html", "r", encoding="utf-8") as file:
        email_html = file.read()

    email_html = email_html.replace("{company_name}", company_name)

    message = Mail(
        from_email=SENDER_EMAIL,
        to_emails=admin_email,
        subject=f"Welcome, {company_name}! Your Company is Registered",
        html_content=email_html
    )

    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"Company registration email sent to {admin_email}. Status: {response.status_code}")
    except Exception as e:
        print(f"Error sending email: {str(e)}")