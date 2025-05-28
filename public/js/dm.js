import { apiRequest } from './utils/apiRequest.js';

document.addEventListener("DOMContentLoaded", async function () {
    const homePanel = document.getElementById("messagePanel");
    const recipientAccountNumber = window.location.pathname.split('/')[2];
    const data = await apiRequest('/api/getUserInfo', 'GET');
    var gebid = document.getElementById.bind(document);
    let accountNumber;

    if (data.success) {
        const user = data.user;
        accountNumber = user.accountNumber;

        fetchRecipientInfo(recipientAccountNumber);
        fetchAndRenderMessages(accountNumber, recipientAccountNumber);
        setupRealTimeUpdates(accountNumber, recipientAccountNumber);
    } else {
        window.location.href = '/';
    }

    async function fetchRecipientInfo(recipientAccountNumber) {
        try {
            const accountNumber = recipientAccountNumber;
            const data = await apiRequest('/api/getUser', 'POST', { accountNumber: accountNumber }); // Send accountNumber as input
            if (data.success) {
                const recipient = data.user;

                const profileImage = gebid("profileImage");
                const profileName = gebid("profileName");

                profileImage.src = recipient.pfp || "/src/default.png"; // Use default if no image
                profileName.textContent = recipient.username || "Unknown User";
            } else {
                console.error("Failed to fetch recipient info:", data.message);
            }
        } catch (error) {
            console.error("Error fetching recipient info:", error);
        }
    }

    gebid("profileButton").addEventListener("click", function (event) {
        event.preventDefault();
        if (accountNumber) { window.location.href = `/profile/${accountNumber}`; }
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
        homePanel.innerHTML = '';

        messages.forEach(message => {appendMessage(message, senderAccountNumber);});

        scrollToBottom();
    }

    function appendMessage(message, senderAccountNumber) {
        const messageDiv = document.createElement('div');
        messageDiv.className = message.from === senderAccountNumber ? 'message sent' : 'message received';
        messageDiv.textContent = message.content;

        homePanel.appendChild(messageDiv);

        scrollToBottom();
    }

    function scrollToBottom() {homePanel.scrollTop = homePanel.scrollHeight;}

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
        }, 1000); 
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