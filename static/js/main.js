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
            // Add focus animation
            emailBody.addEventListener('focus', () => {
                emailBody.style.boxShadow = '0 0 0 3px rgba(74, 111, 165, 0.2)';
            });
            
            emailBody.addEventListener('blur', () => {
                emailBody.style.boxShadow = 'none';
            });
            
            // Debounce function to limit API calls
            let typingTimer;
            const doneTypingInterval = 800; // 0.8 seconds (reduced for better responsiveness)
            
            emailBody.addEventListener('keyup', () => {
                clearTimeout(typingTimer);
                if (emailBody.value) {
                    typingTimer = setTimeout(() => analyzeEmailTone(emailBody.value), doneTypingInterval);
                } else {
                    // Reset tone styling when empty
                    resetToneStyling(emailBody);
                    document.getElementById('tone-container').classList.add('hidden');
                }
            });
        }
    }

    // Logout button handling
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Add animation to elements with the 'animate-on-load' class
    document.querySelectorAll('.animate-on-load').forEach(element => {
        element.classList.add('fade-in');
    });
});

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('email');
    const email = emailInput.value.trim();
    
    if (!email || !isValidEmail(email)) {
        showAlert('Please enter a valid email address', 'danger');
        shakeElement(emailInput);
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
        shakeElement(document.getElementById('email-to'));
        return;
    }
    
    if (!subject) {
        showAlert('Please enter a subject for your email', 'danger');
        shakeElement(document.getElementById('email-subject'));
        return;
    }
    
    if (!body) {
        showAlert('Please enter content for your email', 'danger');
        shakeElement(document.getElementById('email-body'));
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
                
                // Reset tone styling on both body and container
                resetAllToneStyling();
                
                // Show confetti animation for successful send
                showConfetti();
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
    const emailBody = document.getElementById('email-body');
    const emailContainer = document.querySelector('.email-container');
    const toneTitle = document.querySelector('.tone-title');
    
    if (toneContainer && toneValue && toneFeedback) {
        // Show the tone container with animation
        toneContainer.classList.remove('hidden');
        
        // Update tone value and class
        toneValue.textContent = tone;
        
        // Remove all previous tone classes
        toneValue.classList.remove('tone-friendly', 'tone-formal', 'tone-aggressive', 'tone-anxious', 'tone-passive');
        
        // Add the appropriate tone class
        toneValue.classList.add(`tone-${tone.toLowerCase()}`);
        
        // Update feedback
        toneFeedback.textContent = feedback;
        
        // Update email body styling based on tone
        updateEmailBodyTone(emailBody, tone);
        
        // Update email container styling based on tone
        updateEmailContainerTone(emailContainer, tone);
        
        // Update tone title styling
        if (toneTitle) {
            // Remove all previous tone title classes
            toneTitle.classList.remove(
                'tone-title-friendly', 
                'tone-title-formal', 
                'tone-title-aggressive', 
                'tone-title-anxious', 
                'tone-title-passive'
            );
            
            // Add the appropriate tone title class
            toneTitle.classList.add(`tone-title-${tone.toLowerCase()}`);
        }
    }
}

// Update email container styling based on detected tone
function updateEmailContainerTone(emailContainerElement, tone) {
    if (!emailContainerElement) return;
    
    // Remove all previous tone classes
    emailContainerElement.classList.remove(
        'email-container-friendly', 
        'email-container-formal', 
        'email-container-aggressive', 
        'email-container-anxious', 
        'email-container-passive'
    );
    
    // Add the appropriate tone class
    emailContainerElement.classList.add(`email-container-${tone.toLowerCase()}`);
    
    // Apply a gentle transition effect
    emailContainerElement.style.transition = 'all 0.5s ease';
}

// Update email body styling based on detected tone
function updateEmailBodyTone(emailBodyElement, tone) {
    if (!emailBodyElement) return;
    
    // Remove all previous tone classes
    emailBodyElement.classList.remove(
        'email-body-friendly', 
        'email-body-formal', 
        'email-body-aggressive', 
        'email-body-anxious', 
        'email-body-passive'
    );
    
    // Add the appropriate tone class
    emailBodyElement.classList.add(`email-body-${tone.toLowerCase()}`);
    
    // Apply a gentle pulse animation
    emailBodyElement.style.animation = 'none';
    setTimeout(() => {
        emailBodyElement.style.animation = 'pulse 0.5s';
    }, 10);
}

// Reset tone styling on email body
function resetToneStyling(emailBodyElement) {
    if (!emailBodyElement) return;
    
    emailBodyElement.classList.remove(
        'email-body-friendly', 
        'email-body-formal', 
        'email-body-aggressive', 
        'email-body-anxious', 
        'email-body-passive'
    );
    
    // Also reset the email container styling
    const emailContainer = document.querySelector('.email-container');
    if (emailContainer) {
        emailContainer.classList.remove(
            'email-container-friendly', 
            'email-container-formal', 
            'email-container-aggressive', 
            'email-container-anxious', 
            'email-container-passive'
        );
    }
    
    emailBodyElement.style.animation = 'none';
}

// Reset all tone styling throughout the UI
function resetAllToneStyling() {
    const emailBody = document.getElementById('email-body');
    if (emailBody) {
        resetToneStyling(emailBody);
    }
    
    // Reset tone feedback styling
    const toneFeedback = document.getElementById('tone-feedback');
    if (toneFeedback) {
        toneFeedback.className = 'tone-feedback';
    }
    
    // Reset tone title styling
    const toneTitle = document.querySelector('.tone-title');
    if (toneTitle) {
        toneTitle.classList.remove(
            'tone-title-friendly', 
            'tone-title-formal', 
            'tone-title-aggressive', 
            'tone-title-anxious', 
            'tone-title-passive'
        );
    }
    
    // Reset active mood icons
    document.querySelectorAll('.mood-icon').forEach(icon => {
        icon.classList.remove('active');
    });
}

// Show shake animation when validation fails
function shakeElement(element) {
    if (!element) return;
    
    element.style.animation = 'none';
    setTimeout(() => {
        element.style.animation = 'shake 0.5s';
    }, 10);
}

// Create and show confetti animation
function showConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);
    
    // Create confetti particles
    const colors = ['#ff6b6b', '#4a6fa5', '#28a745', '#ffc107', '#17a2b8'];
    
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confettiContainer.appendChild(confetti);
    }
    
    // Remove confetti after animation
    setTimeout(() => {
        confettiContainer.remove();
    }, 4000);
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
            alert.classList.add('fade-out');
            setTimeout(() => {
                alert.remove();
            }, 300);
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