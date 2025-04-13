# Email Configuration
EMAIL_CONFIG = {
    'SMTP_SERVER': 'smtp.gmail.com',
    'SMTP_PORT': 587,
    'EMAIL_ADDRESS': 'your_email@gmail.com',
    'EMAIL_PASSWORD': 'your_app_password_here',
    'USE_TLS': True
}

# NOTE: For Gmail, you need to:
# 1. Enable 2-Step Verification on your Google account
# 2. Generate an App Password at https://myaccount.google.com/apppasswords
# 3. Use that App Password here instead of your regular password

# Instructions:
# 1. Copy this file to config.py
# 2. Replace the placeholder values with your actual email configuration
# 3. Keep config.py out of version control for security 