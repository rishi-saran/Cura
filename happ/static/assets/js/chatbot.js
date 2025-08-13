function toggleChatbot() {
    let chatbotIcon = document.getElementById("chatbot-icon");
    let chatbotBox = document.getElementById("chatbot-box");

    chatbotBox.style.display = chatbotBox.style.display === "block" ? "none" : "block";
    chatbotIcon.style.display = chatbotBox.style.display === "block" ? "none" : "block";
}

function initiateChat() {
    let messagesContainer = document.getElementById("chatbot-messages");
    messagesContainer.innerHTML = `
        <p class="bot-message">👋 Hi! Welcome to Cura Chatbot.</p>
        <p class="bot-message">Let's get started! How are you feeling today?</p>
    `;
}

function handleChatbotInput(event) {
    if (event.key === "Enter") {
        let inputField = document.getElementById("chatbot-input");
        let message = inputField.value.trim();
        if (message) {
            displayMessage(message, "user");
            showTypingIndicator();
            setTimeout(() => {
                getChatbotResponse(message);
            }, 1500);
            inputField.value = "";
        }
    }
}

function displayMessage(message, sender) {
    let messageContainer = document.createElement("p");
    messageContainer.className = sender === "user" ? "user-message" : "bot-message";

    if (sender === "bot") {
        messageContainer.innerHTML = message;  // ✅ Renders HTML correctly
    } else {
        messageContainer.textContent = message;  // Plain text for user input
    }

    document.getElementById("chatbot-messages").appendChild(messageContainer);
    scrollToBottom();
}


function showTypingIndicator() {
    let messagesContainer = document.getElementById("chatbot-messages");

    let typingIndicator = document.createElement("div");
    typingIndicator.className = "bot-message typing-indicator";
    typingIndicator.id = "typing-indicator";

    typingIndicator.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;

    messagesContainer.appendChild(typingIndicator);
    scrollToBottom();
}
function removeTypingIndicator() {
    let typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) typingIndicator.remove();
}

function getChatbotResponse(message) {
    fetch("/chatbot-response/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message })
    })
    .then(response => response.json())
    .then(data => {
        removeTypingIndicator();
        displayMessage(data.answer, "bot");
    })
    .catch(error => {
        console.error("Error:", error);
        removeTypingIndicator();
        displayMessage("Sorry, I couldn’t process that.", "bot");
    });
}

function scrollToBottom() {
    let messagesContainer = document.getElementById("chatbot-messages");
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
}

document.addEventListener("DOMContentLoaded", initiateChat);
