// JavaScript for debugging and UI interactions
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Page loaded successfully!');

    // Ensure the login form exists before adding an event listener
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            console.log("🚀 Login form submitted!");
        });
    } else {
        console.warn("⚠️ Warning: Login form not found!");
    }

    // Ensure the signup form exists before adding an event listener
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", function (event) {
            console.log("🆕 Signup form submitted!");
        });
    } else {
        console.warn("⚠️ Warning: Signup form not found!");
    }
});

// Toggle Password Visibility
function togglePassword(fieldId) {
    const passwordField = document.getElementById(fieldId);
    if (passwordField) {
        passwordField.type = passwordField.type === "password" ? "text" : "password";
        console.log(`🔄 Password visibility toggled for: ${fieldId}`);
    } else {
        console.warn(`⚠️ Warning: Password field '${fieldId}' not found!`);
    }
}

// Validate Email Format
function validateEmail(email) {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
}

// Validate Password Strength
function validatePassword(password) {
    return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%?&])[A-Za-z\d@$!%*?&]{6,}$/.test(password);
}

// Prevent unwanted gestures
document.addEventListener("gesturestart", function (e) {
    e.preventDefault();
});
document.addEventListener("dblclick", function (e) {
    e.preventDefault();
});

//medications script

document.addEventListener("DOMContentLoaded", function() {
    const detailsButtons = document.querySelectorAll(".details-btn");
    
    detailsButtons.forEach(button => {
        button.addEventListener("click", function() {
            alert("More details coming soon!");
        });
    });

    const dateSelector = document.querySelector(".date-selector");
    const dateElement = document.querySelector(".date");

    let currentDate = new Date();
    
    function updateDate() {
        const day = currentDate.getDate();
        const options = { weekday: 'short', month: 'long' };
        const formattedDate = `${day} <span>${currentDate.toLocaleDateString('en-US', options)}</span>`;
        dateElement.innerHTML = formattedDate;
    }

    dateSelector.querySelector("button:nth-child(1)").addEventListener("click", function() {
        currentDate.setDate(currentDate.getDate() - 1);
        updateDate();
    });

    dateSelector.querySelector("button:nth-child(3)").addEventListener("click", function() {
        currentDate.setDate(currentDate.getDate() + 1);
        updateDate();
    });

    updateDate();
});

//med_aspirin scripts

document.addEventListener("DOMContentLoaded", function () {
    const backButton = document.querySelector(".back-btn");
    const forwardButtons = document.querySelectorAll(".forward-btn"); // Select all forward buttons

    if (backButton) {
        backButton.addEventListener("click", function () {
            window.location.href = "/medications/";  // Ensure this URL is correct
        });
    }

    if (forwardButtons) {
        forwardButtons.forEach((button, index) => {
            button.addEventListener("click", function () {
                if (index === 0) {
                    window.location.href = "/med_aspirin/";  // Redirect for Aspirin
                } else if (index === 1) {
                    window.location.href = "/med_pill/";  // Redirect for Cymbalta (or another capsule)
                } else if (index === 2) {
                    window.location.href = "/med_capsule/";  // Redirect for Lexapro (or another tablet)
                }
            });
        });
    }
});


//med_schedule scripts

document.addEventListener("DOMContentLoaded", function () {
    const scheduleButton = document.querySelector(".schedule-btn");

    if (scheduleButton) {
        scheduleButton.addEventListener("click", function () {
            window.location.href = "/med_schedule/"; // Update with the correct URL
        });
    }
});

// ✅ Add Schedule button with toast on redirect
const add_sch_btn = document.getElementById("add-schedule-btn");
if (add_sch_btn) {
    add_sch_btn.addEventListener('click', () => {
        localStorage.setItem("scheduleSuccess", "true"); // Set flag before redirect
        window.location.href = "/medications/"; // Redirect
    });
}


document.addEventListener("DOMContentLoaded", function () {
    let secondsRemaining = 343; // Example: 5 minutes 43 seconds
    const countdownTimer = document.getElementById("countdown-timer");
    const reminderBox = document.getElementById("medication-reminder");
    const yesButton = document.querySelector(".yes-btn"); // Selecting by class

    setInterval(function () {
        let minutes = Math.floor(secondsRemaining / 60);
        let seconds = secondsRemaining % 60;
        countdownTimer.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        if (secondsRemaining > 0) secondsRemaining--;
    }, 1000);

    // Hide the medication reminder when "YES" is clicked
    yesButton.addEventListener("click", function () {
        reminderBox.style.display = "none"; // Hides the reminder box
    });
});

