import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from config.settings import settings

SMTP_HOST = settings.SMTP_HOST
SMTP_PORT = settings.SMTP_PORT
SMTP_USER = settings.SMTP_USER
SMTP_PASSWORD = settings.SMTP_PASSWORD
EMAIL_FROM = settings.EMAIL_FROM
FRONTEND_URL = settings.FRONTEND_URL

# Outbound email log directory when SMTP credentials are not configured
LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sent_emails")
os.makedirs(LOG_DIR, exist_ok=True)


def send_email_html(to_email: str, subject: str, html_body: str) -> bool:
    print(f"--- EMAIL TO: {to_email} | SUBJECT: {subject} ---")
    
    # Always log email HTML to file for local testing
    clean_subj = subject.replace(" ", "_").replace(":", "_").replace("🎉", "welcome")
    filename = os.path.join(LOG_DIR, f"email_{clean_subj}.html")
    with open(filename, "w", encoding="utf-8") as f:
        f.write(f"<!-- TO: {to_email} | SUBJECT: {subject} -->\n" + html_body)

    if not SMTP_USER or not SMTP_PASSWORD or "your_" in SMTP_USER:
        print(f"[EMAIL MOCK LOGGED] {filename}")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = EMAIL_FROM
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(EMAIL_FROM, [to_email], msg.as_string())
        print(f"[EMAIL DELIVERED VIA SMTP] {to_email}")
        return True
    except Exception as e:
        print(f"[EMAIL DELIVERY ERROR]: {e}")
        return False


def send_verification_email(to_email: str, first_name: str, verify_token: str):
    verify_url = f"{FRONTEND_URL}/account/verify?token={verify_token}"
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 30px;">
      <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px;">
        <h2 style="color: #1e40af; margin-top: 0;">Verify Your Account 👋</h2>
        <p>Hello <strong>{first_name}</strong>,</p>
        <p>Thank you for registering with LegalSathi AI.</p>
        <p>Please verify your email address to activate your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{verify_url}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; display: inline-block;">Verify Email</a>
        </div>
        <p style="font-size: 12px; color: #64748b;">This verification link expires in 24 hours.</p>
        <p style="font-size: 12px; color: #64748b;">If you did not create this account, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">Regards,<br/>LegalSathi AI Team</p>
      </div>
    </body>
    </html>
    """
    return send_email_html(to_email, "Verify Your LegalSathi AI Account", html)


def send_password_reset_email(to_email: str, reset_token: str):
    reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 30px;">
      <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px;">
        <h2 style="color: #1e40af; margin-top: 0;">Reset Your Password 🔒</h2>
        <p>Hello,</p>
        <p>We received a request to reset the password for your LegalSathi AI account. Click the button below to choose a new password.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{reset_url}" style="background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 12px; color: #64748b;">This link will expire in 30 minutes. If you did not request a password reset, your account is secure and you can ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">LegalSathi AI Security Team</p>
      </div>
    </body>
    </html>
    """
    return send_email_html(to_email, "Reset Your Password - LegalSathi AI", html)


def send_welcome_email(to_email: str, first_name: str):
    start_url = f"{FRONTEND_URL}/dashboard"
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 30px;">
      <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px;">
        <h2 style="color: #1e40af; margin-top: 0;">Welcome to LegalSathi AI 🎉</h2>
        <p>Hello <strong>{first_name}</strong>,</p>
        <p>Your account is now fully active! You have unlocked complete access to:</p>
        <ul style="line-height: 1.8; color: #334155;">
          <li>🤖 Unlimited AI Legal Consultation</li>
          <li>🧭 Personalized AI Case Navigator & Action Plans</li>
          <li>📄 Automated Legal Document & Notice Generator</li>
          <li>📂 Case History & Evidence Tracking</li>
          <li>🌐 Verified Government Portals & Legal Guidelines</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{start_url}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; display: inline-block;">Start Here</a>
        </div>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">LegalSathi AI Team</p>
      </div>
    </body>
    </html>
    """
    return send_email_html(to_email, "Welcome to LegalSathi AI 🎉", html)


def send_document_generated_email(to_email: str, doc_type: str):
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 30px;">
      <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px;">
        <h2 style="color: #1e40af; margin-top: 0;">Legal Document Ready 📄</h2>
        <p>Your legal document draft (<strong>{doc_type}</strong>) has been successfully generated.</p>
        <p>You can access, edit, and download it anytime from your LegalSathi Dashboard.</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="{FRONTEND_URL}/documents" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; display: inline-block;">View My Documents</a>
        </div>
      </div>
    </body>
    </html>
    """
    return send_email_html(to_email, f"Document Ready: {doc_type} - LegalSathi AI", html)


def send_case_saved_email(to_email: str, case_code: str, case_title: str):
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 30px;">
      <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px;">
        <h2 style="color: #1e40af; margin-top: 0;">Case Saved to Account 🧭</h2>
        <p>Case <strong>[{case_code}] {case_title}</strong> has been saved to your dashboard.</p>
        <p>You can track resolution progress, evidence checklists, and legal timelines anytime.</p>
      </div>
    </body>
    </html>
    """
    return send_email_html(to_email, f"Case Saved [{case_code}] - LegalSathi AI", html)


def send_security_alert_email(to_email: str, alert_details: str):
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 30px;">
      <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px;">
        <h2 style="color: #dc2626; margin-top: 0;">Security Alert 🚨</h2>
        <p>We detected security activity on your account: <strong>{alert_details}</strong>.</p>
        <p>If this was not you, please reset your password immediately.</p>
      </div>
    </body>
    </html>
    """
    return send_email_html(to_email, "Security Alert - LegalSathi AI", html)
