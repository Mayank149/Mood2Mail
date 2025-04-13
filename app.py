from flask import Flask, request, jsonify, render_template, redirect, url_for, session
import joblib
import numpy as np
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json
from datetime import timedelta

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
    
    # In a real application, you would configure SMTP settings and send the email
    # For demo purposes, we'll simulate sending an email and just return success
    try:
        # Dummy email sending logic
        # In a real app, you would configure SMTP settings like:
        # server = smtplib.SMTP('smtp.gmail.com', 587)
        # server.starttls()
        # server.login('your_email@gmail.com', 'your_password')
        # 
        # msg = MIMEMultipart()
        # msg['From'] = session['email']
        # msg['To'] = to_email
        # msg['Subject'] = subject
        # msg.attach(MIMEText(body, 'plain'))
        # 
        # server.send_message(msg)
        # server.quit()
        
        # For now, just log the email details
        print(f"Email sent from {session['email']} to {to_email}")
        print(f"Subject: {subject}")
        print(f"Body: {body}")
        
        return jsonify({'success': True, 'message': 'Email sent successfully'})
    except Exception as e:
        return jsonify({'error': f'Failed to send email: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)
