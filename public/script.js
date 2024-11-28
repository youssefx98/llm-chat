// Get references to elements
const sendButton = document.getElementById("send-btn");
const userInputField = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");

// Function to scroll to the bottom of the chat box
function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Function to display a message in the chat box
function displayMessage(content, isUser = true) {
    // Create a new message div
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    
    // Add specific classes based on whether the message is from the user or the bot
    if (isUser) {
        messageDiv.classList.add("user-message");
    } else {
        messageDiv.classList.add("bot-message");
    }

    // Insert the message content
    messageDiv.innerHTML = `<p>${content}</p>`;

    // Append the message to the chat box
    chatBox.appendChild(messageDiv);

    // Scroll to the bottom to display the latest message
    scrollToBottom();
}

// Function to send a message to the server (OpenAI API)
async function sendMessage() {
    const userMessage = userInputField.value.trim();
    
    if (userMessage === "") {
        return; // Don't send an empty message
    }

    // Display user message in the chat
    displayMessage(userMessage, true);
    
    // Clear the input field
    userInputField.value = "";
    
    // Disable the input and button while waiting for the response
    userInputField.disabled = true;
    sendButton.disabled = true;

    try {
        // Send the user message to the server
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: userMessage })
        });

        if (response.ok) {
            const data = await response.json();
            const botReply = data.reply;
            // Display the bot's response in the chat
            displayMessage(botReply, false);
        } else {
            // Handle error if the response is not successful
            displayMessage("Oops, something went wrong. Please try again later.", false);
        }
    } catch (error) {
        console.error("Error during API call:", error);
        displayMessage("Oops, something went wrong. Please try again later.", false);
    } finally {
        // Re-enable the input and button after the response is displayed
        userInputField.disabled = false;
        sendButton.disabled = false;
    }
}

// Event listener for the send button
sendButton.addEventListener("click", sendMessage);

// Event listener for Enter key press
userInputField.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        sendMessage();
    }
});
