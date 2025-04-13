from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)

# Load the pre-trained model and vectorizer
model = joblib.load('nb_classifier.pkl')  # Load the trained Naive Bayes model
vectorizer = joblib.load('tfidf_vectorizer.pkl')  # Load the TF-IDF vectorizer

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

    # Provide feedback (this can be improved with custom messages)
    feedback = f"The tone is classified as: {tone}. Consider adjusting your tone for clarity and appropriateness."
    
    return jsonify({'tone': tone, 'feedback': feedback})

if __name__ == '__main__':
    app.run(debug=True)
