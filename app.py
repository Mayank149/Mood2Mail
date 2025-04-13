from flask import Flask, request, jsonify, render_template, redirect, url_for, session, flash
import joblib
import numpy as np
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json
from datetime import timedelta
import traceback
from config import EMAIL_CONFIG

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Secret key for session management
app.permanent_session_lifetime = timedelta(days=7)  # Session lasts for 7 days

# Load the pre-trained model and vectorizer
model = joblib.load('nb_classifier.pkl')  # Load the trained Naive Bayes model
vectorizer = joblib.load('tfidf_vectorizer.pkl')  # Load the TF-IDF vectorizer

# Route for the home/login page
@app.route('/', methods=['GET'])
def login():
    print("Login page accessed")
    # If user is already logged in, redirect to compose page
    if 'email' in session:
        print(f"User already logged in as {session['email']}, redirecting to compose")
        return redirect(url_for('compose'))
    print("Rendering login page")
    return render_template('login.html')

# Route for handling login
@app.route('/login', methods=['POST'])
def handle_login():
    print("Login form submitted")
    email = request.form.get('email')
    print(f"Email received: {email}")
    
    if not email:
        print("No email provided")
        return jsonify({'error': 'Email is required'}), 400
    
    # Store the email in session
    session.permanent = True
    session['email'] = email
    print(f"User logged in as {email}, redirecting to compose")
    
    return redirect(url_for('compose'))

# Route for the email composer page
@app.route('/compose', methods=['GET'])
def compose():
    print("Compose page accessed")
    # Check if user is logged in
    if 'email' not in session:
        print("User not logged in, redirecting to login")
        return redirect(url_for('login'))
    
    print(f"User authenticated as {session['email']}, rendering compose page")
    return render_template('compose.html')

# Only admin can access settings now
@app.route('/settings', methods=['GET'])
def settings():
    # Check if user is logged in
    if 'email' not in session:
        return redirect(url_for('login'))
    
    # You can define admin emails here
    admin_emails = ['mood2mailsender@gmail.com']  # Add your admin email address here
    
    # Check if the current user is an admin
    if session['email'] not in admin_emails:
        return redirect(url_for('compose'))
    
    # Get any flash messages
    saved = request.args.get('saved', False)
    error = request.args.get('error', None)
    
    return render_template('settings.html', config=EMAIL_CONFIG, saved=saved, error=error)

# Only admin can save settings
@app.route('/settings/save', methods=['POST'])
def save_settings():
    # Check if user is logged in
    if 'email' not in session:
        return redirect(url_for('login'))
    
    # You can define admin emails here
    admin_emails = ['mood2mailsender@gmail.com']  # Add your admin email address here
    
    # Check if the current user is an admin
    if session['email'] not in admin_emails:
        return redirect(url_for('compose'))
    
    try:
        # Get the form data
        smtp_server = request.form.get('smtp_server')
        smtp_port = request.form.get('smtp_port')
        email_address = request.form.get('email_address')
        email_password = request.form.get('email_password')
        use_tls = 'use_tls' in request.form
        
        # Validate inputs
        if not all([smtp_server, smtp_port, email_address, email_password]):
            return redirect(url_for('settings', error='All fields are required'))
        
        # Convert port to int
        try:
            smtp_port = int(smtp_port)
        except ValueError:
            return redirect(url_for('settings', error='Port must be a number'))
        
        # Update the configuration
        EMAIL_CONFIG['SMTP_SERVER'] = smtp_server
        EMAIL_CONFIG['SMTP_PORT'] = smtp_port
        EMAIL_CONFIG['EMAIL_ADDRESS'] = email_address
        EMAIL_CONFIG['EMAIL_PASSWORD'] = email_password
        EMAIL_CONFIG['USE_TLS'] = use_tls
        
        # Save the updated config to the file
        config_content = f'''# Email Configuration
EMAIL_CONFIG = {{
    'SMTP_SERVER': '{smtp_server}',
    'SMTP_PORT': {smtp_port},
    'EMAIL_ADDRESS': '{email_address}',
    'EMAIL_PASSWORD': '{email_password}',
    'USE_TLS': {use_tls}
}}

# NOTE: For Gmail, you need to:
# 1. Enable 2-Step Verification on your Google account
# 2. Generate an App Password at https://myaccount.google.com/apppasswords
# 3. Use that App Password here instead of your regular password'''
        
        with open('config.py', 'w') as f:
            f.write(config_content)
        
        # Test the connection
        try:
            # Create SMTP session
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.ehlo()
            
            # Start TLS for security if configured
            if use_tls:
                server.starttls()
                server.ehlo()
            
            # Login to the email server
            server.login(email_address, email_password)
            
            # Close the connection
            server.quit()
            
            print("Email settings tested successfully")
        except Exception as e:
            print(f"Email test failed: {str(e)}")
            return redirect(url_for('settings', error=f'Failed to connect: {str(e)}'))
        
        return redirect(url_for('settings', saved=True))
    except Exception as e:
        print(f"Error saving settings: {str(e)}")
        traceback.print_exc()
        return redirect(url_for('settings', error=f'Error: {str(e)}'))

# Route for logging out
@app.route('/logout', methods=['GET'])
def logout():
    # Clear session data
    print(f"Logging out user: {session.get('email', 'Unknown')}")
    session.pop('email', None)
    return redirect(url_for('login'))

# API endpoint for tone prediction
@app.route('/predict', methods=['POST'])
def predict():
    # Get the email content from the frontend
    email_content = request.json.get('email_text')
    
    if not email_content:
        return jsonify({'error': 'No email content provided'}), 400
    
    # Preprocess the email content using the vectorizer
    transformed_text = vectorizer.transform([email_content])
    
    # Make the prediction using the trained model
    prediction = model.predict(transformed_text)
    
    # Map the prediction to the corresponding tone category
    tone_map = {
        'Friendly': 'Friendly',
        'Aggressive': 'Aggressive',
        'Formal': 'Formal',
        'Anxious': 'Anxious',
        'Passive': 'Passive'
    }
    
    tone = tone_map.get(prediction[0], 'Unknown')

    # Provide feedback based on the tone
    feedback_map = {
        'Friendly': "Your email has a friendly tone, which is great for casual communication and maintaining positive relationships.",
        'Aggressive': "Your email has an aggressive tone, which might come across as confrontational. Consider softening your language for better reception.",
        'Formal': "Your email has a formal tone, which is appropriate for professional communication. Ensure it conveys respect without being overly rigid.",
        'Anxious': "Your email has an anxious tone, which might show uncertainty. Consider using more confident language if appropriate.",
        'Passive': "Your email has a passive tone, which may lack assertiveness. Consider using more direct language to clarify your intentions."
    }
    
    feedback = feedback_map.get(tone, "Consider adjusting your tone for clarity and appropriateness.")
    
    return jsonify({'tone': tone, 'feedback': feedback})

def send_email_with_gmail(from_email, to_email, subject, body):
    """Helper function to send email using Gmail SMTP"""
    # Check if email configuration is set up
    if not EMAIL_CONFIG['EMAIL_ADDRESS'] or not EMAIL_CONFIG['EMAIL_PASSWORD']:
        raise ValueError("Email credentials not configured. Please ask the administrator to update email settings")
    
    # Create a MIMEMultipart message
    msg = MIMEMultipart()
    # Always send from the configured email address
    msg['From'] = EMAIL_CONFIG['EMAIL_ADDRESS']
    # Set Reply-To header to the user's email
    msg['Reply-To'] = from_email
    msg['To'] = to_email
    msg['Subject'] = subject
    
    # Modify the body to include a signature
    signature = f"\n\n---\nSent by {from_email} via Mood2Mail"
    full_body = body + signature
    
    # Add message body
    msg.attach(MIMEText(full_body, 'plain'))
    
    try:
        # Create SMTP session
        server = smtplib.SMTP(EMAIL_CONFIG['SMTP_SERVER'], EMAIL_CONFIG['SMTP_PORT'])
        server.ehlo()
        
        # Start TLS for security if configured
        if EMAIL_CONFIG['USE_TLS']:
            server.starttls()
            server.ehlo()
        
        # Login to the email server using the configured credentials
        server.login(EMAIL_CONFIG['EMAIL_ADDRESS'], EMAIL_CONFIG['EMAIL_PASSWORD'])
        
        # Send the email
        server.send_message(msg)
        
        # Close the connection
        server.quit()
        
        print(f"Email successfully sent on behalf of {from_email} to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        traceback.print_exc()
        raise e

# API endpoint for sending emails
@app.route('/send_email', methods=['POST'])
def send_email():
    # Check if user is logged in
    if 'email' not in session:
        return jsonify({'error': 'User not logged in'}), 401
    
    # Get email details from the frontend
    to_email = request.json.get('to')
    subject = request.json.get('subject')
    body = request.json.get('body')
    
    if not all([to_email, subject, body]):
        return jsonify({'error': 'Missing email details'}), 400
    
    try:
        # Get the user's email from the session
        from_email = session['email']
        
        # Send the email using our helper function
        send_email_with_gmail(from_email, to_email, subject, body)
        
        return jsonify({'success': True, 'message': 'Email sent successfully'})
    except ValueError as e:
        # Configuration error
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        # Other errors (SMTP, connection, etc.)
        return jsonify({'error': f'Failed to send email: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)
