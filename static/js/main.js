document.addEventListener('DOMContentLoaded', () => {
    // Login form handling
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Email form handling
    const emailForm = document.getElementById('email-form');
    if (emailForm) {
        emailForm.addEventListener('submit', handleEmailSubmit);
        
        // Real-time tone analysis when typing in the email body
        const emailBody = document.getElementById('email-body');
        if (emailBody) {
            // Debounce function to limit API calls
            let typingTimer;
            const doneTypingInterval = 1000; // 1 second
            
            emailBody.addEventListener('keyup', () => {
                clearTimeout(typingTimer);
                if (emailBody.value) {
                    typingTimer = setTimeout(() => analyzeEmailTone(emailBody.value), doneTypingInterval);
                }
            });
        }
    }

    // Logout button handling
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('email');
    const email = emailInput.value.trim();
    
    if (!email || !isValidEmail(email)) {
        showAlert('Please enter a valid email address', 'danger');
        return;
    }
    
    // Submit the form to the server
    document.getElementById('login-form').submit();
}

// Handle email form submission
async function handleEmailSubmit(e) {
    e.preventDefault();
    
    const to = document.getElementById('email-to').value.trim();
    const subject = document.getElementById('email-subject').value.trim();
    const body = document.getElementById('email-body').value.trim();
    
    if (!to || !isValidEmail(to)) {
        showAlert('Please enter a valid recipient email', 'danger');
        return;
    }
    
    if (!subject) {
        showAlert('Please enter a subject for your email', 'danger');
        return;
    }
    
    if (!body) {
        showAlert('Please enter content for your email', 'danger');
        return;
    }
    
    // First analyze the tone
    const toneResult = await analyzeEmailTone(body, true);
    
    // If tone analysis is successful, proceed to send email
    if (toneResult) {
        showLoadingSpinner(true);
        
        try {
            // Send the email using the backend API
            const response = await fetch('/send_email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: to,
                    subject: subject,
                    body: body
                })
            });
            
            const data = await response.json();
            
            if (data.error) {
                showAlert(data.error, 'danger');
            } else {
                showAlert('Email sent successfully!', 'success');
                document.getElementById('email-form').reset();
                
                // Hide the tone result after sending
                document.getElementById('tone-container').classList.add('hidden');
            }
        } catch (error) {
            showAlert('Failed to send email. Please try again.', 'danger');
        } finally {
            showLoadingSpinner(false);
        }
    }
}

// Analyze email tone using the backend API
async function analyzeEmailTone(emailText, isSubmit = false) {
    if (!emailText) return null;
    
    if (!isSubmit) {
        // Only show loading spinner for real-time analysis if the text is long enough
        if (emailText.length > 10) {
            showLoadingSpinner(true);
        } else {
            return null;
        }
    }
    
    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email_text: emailText })
        });
        
        const data = await response.json();
        
        if (data.error) {
            showAlert(data.error, 'danger');
            return null;
        }
        
        // Update the UI with tone analysis results
        updateToneUI(data.tone, data.feedback);
        return data;
    } catch (error) {
        if (isSubmit) {
            showAlert('Failed to analyze email tone. Please try again.', 'danger');
        }
        return null;
    } finally {
        if (!isSubmit) {
            showLoadingSpinner(false);
        }
    }
}

// Update the UI with tone analysis results
function updateToneUI(tone, feedback) {
    const toneContainer = document.getElementById('tone-container');
    const toneValue = document.getElementById('tone-value');
    const toneFeedback = document.getElementById('tone-feedback');
    
    if (toneContainer && toneValue && toneFeedback) {
        // Show the tone container
        toneContainer.classList.remove('hidden');
        
        // Update tone value and class
        toneValue.textContent = tone;
        
        // Remove all previous tone classes
        toneValue.classList.remove('tone-friendly', 'tone-formal', 'tone-aggressive', 'tone-anxious', 'tone-passive');
        
        // Add the appropriate tone class
        toneValue.classList.add(`tone-${tone.toLowerCase()}`);
        
        // Update feedback
        toneFeedback.textContent = feedback;
    }
}

// Handle user logout
function handleLogout() {
    // The logout is now handled by the server through the href link
    // This function is kept for any additional client-side logout logic
}

// Utility function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show alert message
function showAlert(message, type) {
    // Remove any existing alerts
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // Insert alert before the form
    const formContainer = document.querySelector('.auth-container') || document.querySelector('.email-container');
    if (formContainer) {
        formContainer.insertBefore(alert, formContainer.firstChild);
        
        // Auto-remove alert after 5 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
}

// Show/hide loading spinner
function showLoadingSpinner(show) {
    const spinnerElements = document.querySelectorAll('.spinner');
    spinnerElements.forEach(spinner => {
        if (show) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    });
    
    // Also toggle button loading state
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    submitButtons.forEach(button => {
        button.disabled = show;
    });
} 