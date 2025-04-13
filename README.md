# Mood2Mail

Mood2Mail is an intelligent email tone analyzer and composition tool that helps users write more effective emails by providing real-time feedback on the emotional tone of their messages.

## Features

- **Real-time Tone Analysis**: Analyzes your email content as you type and classifies it into one of five tones: Friendly, Formal, Aggressive, Anxious, or Passive.
- **Visual Feedback**: Changes the composition area's color based on the detected tone for immediate visual feedback.
- **Personalized Suggestions**: Provides specific tips to improve your email based on the detected tone.
- **Email Sending**: Send emails directly through the platform with your tone-optimized content.
- **Responsive Design**: Works smoothly on desktop and mobile devices.
- **Dark Theme**: Modern dark interface for comfortable use.

## Technology Stack

- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, JavaScript
- **Machine Learning**: Naive Bayes classifier with TF-IDF vectorization
- **Email Handling**: SMTP integration via Python's `smtplib`

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/mood2mail.git
   cd mood2mail
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Configure email settings:
   - Open `config.py` and update the email configuration
   - For Gmail, you'll need to create an App Password

4. Run the application:
   ```
   python app.py
   ```

5. Access the application in your browser:
   ```
   http://127.0.0.1:5000
   ```

## Deployment on Render

1. **Create a new Web Service on Render**:
   - Sign up/log in to [Render](https://render.com)
   - Click "New +" and select "Web Service"
   - Connect to your GitHub repository

2. **Configure the Web Service**:
   - Name: `mood2mail` (or your preferred name)
   - Environment: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`

3. **Set Environment Variables**:
   - In the Render dashboard, go to "Environment" tab and add:
     - `SECRET_KEY`: a secure random string
     - Any other configuration variables you need

4. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically build and deploy your application

5. **Configure Email Settings**:
   - After deployment, log in to your application using your admin email
   - Access the Settings page to configure the email sending service

## Usage

1. **Login**: Enter your email address to start using the application.

2. **Compose**: Write your email in the composition area.
   - As you type, the system will analyze your text in real-time
   - The composition area will change color based on the detected tone
   - Review the tone analysis and feedback below the composition area

3. **Send**: Enter the recipient's email address and subject, then send your email.

## Tone Categories

- **Friendly**: Warm, approachable communication ideal for building rapport
- **Formal**: Professional, structured communication appropriate for business context
- **Aggressive**: Direct, forceful language that may come across as confrontational
- **Anxious**: Uncertain or worrisome tone that may convey lack of confidence
- **Passive**: Indirect communication that may lack clarity or assertiveness

## Administrator Settings

The application allows admin users to configure email sending settings:
- Access admin settings by logging in with an admin email account
- Configure SMTP server, port, credentials, and security settings

## Future Improvements

- Multi-language support
- User accounts with saved preferences
- Email templates library
- Integration with popular email clients
- Advanced tone analysis with more categories
- Sentence-level tone suggestions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Creator

Developed by Mayank Bansal 