import { apiRequest } from './utils/apiRequest.js';

document.addEventListener("DOMContentLoaded", async function () {
    const homePanel = document.getElementById("messagePanel");
    var gebid = document.getElementById.bind(document);

    let accountNumber;
    const recipientAccountNumber = window.location.pathname.split('/')[2]; // Extract recipient's account number from URL

    async function fetchUserInfo() {
        try {
            const data = await apiRequest('/api/getUserInfo', 'GET');
            if (data.success) {
                const user = data.user;
                accountNumber = user.accountNumber;

                // Fetch recipient's profile data and populate dmTop
                fetchRecipientInfo(recipientAccountNumber);

                // Fetch and render messages
                fetchAndRenderMessages(accountNumber, recipientAccountNumber);
                setupRealTimeUpdates(accountNumber, recipientAccountNumber);
            } else {
                window.location.href = '/';
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
            window.location.href = '/';
        }
    }

    async function fetchRecipientInfo(recipientAccountNumber) {
        try {
            const accountNumber = recipientAccountNumber;
            const data = await apiRequest('/api/getUser', 'POST', { accountNumber: accountNumber }); // Send accountNumber as input
            if (data.success) {
                const recipient = data.user;

                // Populate the profile image and name in the dmTop div
                const profileImage = document.getElementById("profileImage");
                const profileName = document.getElementById("profileName");

                profileImage.src = recipient.pfp || "/images/default-profile.png"; // Use default if no image
                profileName.textContent = recipient.username || "Unknown User";
            } else {
                console.error("Failed to fetch recipient info:", data.message);
            }
        } catch (error) {
            console.error("Error fetching recipient info:", error);
        }
    }

    document.getElementById("profileButton").addEventListener("click", function (event) {
        event.preventDefault();
        if (accountNumber) {window.location.href = `/profile/${accountNumber}`;}
    });

    async function fetchAndRenderMessages(senderAccountNumber, recipientAccountNumber) {
        try {
            const data = await apiRequest('/api/getMessages', 'POST', { from: senderAccountNumber, to: recipientAccountNumber });
            if (data.success) {
                renderMessages(data.messages, senderAccountNumber);
            } else {
                console.error('Failed to fetch messages:', data.message);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }

    function renderMessages(messages, senderAccountNumber) {
        homePanel.innerHTML = ''; // Clear the panel before rendering

        messages.forEach(message => {
            appendMessage(message, senderAccountNumber);
        });

        scrollToBottom(); // Ensure the panel scrolls to the bottom
    }

    function appendMessage(message, senderAccountNumber) {
        const messageDiv = document.createElement('div');
        messageDiv.className = message.from === senderAccountNumber ? 'message sent' : 'message received';
        messageDiv.textContent = message.content;

        homePanel.appendChild(messageDiv);

        scrollToBottom(); // Scroll to the bottom after appending a new message
    }

    function scrollToBottom() {
        homePanel.scrollTop = homePanel.scrollHeight; // Scroll to the bottom of the panel
    }

    async function sendMessage(content) {
        try {
            const data = await apiRequest('/api/sendMessage', 'POST', { to: recipientAccountNumber, content });
            if (data.success) {
                // Append the new message to the panel
                appendMessage(data.messageData, accountNumber);
            } else {
                console.error('Failed to send message:', data.message);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    function setupRealTimeUpdates(senderAccountNumber, recipientAccountNumber) {
        setInterval(async () => {
            try {
                const data = await apiRequest('/api/getMessages', 'POST', { from: senderAccountNumber, to: recipientAccountNumber });
                if (data.success) {
                    renderMessages(data.messages, senderAccountNumber);
                }
            } catch (error) {
                console.error('Error fetching real-time messages:', error);
            }
        }, 1000); // Poll every 3 seconds
    }

    // Create the send message box outside the homePanel
    function setupInputBox() {
        if (!document.querySelector('.inputContainer')) {
            const inputContainer = document.createElement('div');
            inputContainer.className = 'inputContainer';

            const messageInput = document.createElement('textarea');
            messageInput.id = 'messageInput';
            messageInput.placeholder = 'Type your message...';

            const sendButton = document.createElement('button');
            sendButton.id = 'sendButton';
            sendButton.textContent = 'Send';

            inputContainer.appendChild(messageInput);
            inputContainer.appendChild(sendButton);
            document.body.appendChild(inputContainer); // Append to the document body

            // Add event listener to send button
            sendButton.addEventListener('click', () => {
                const content = messageInput.value.trim();
                if (content) {
                    sendMessage(content);
                    messageInput.value = ''; // Clear the input box
                }
            });
        }
    }

    // Ensure the input box is set up after the DOM is loaded
    setupInputBox();

    fetchUserInfo();
});