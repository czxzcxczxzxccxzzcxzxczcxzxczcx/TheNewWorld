import { apiRequest } from './utils/apiRequest.js';
import { renderBar, initializeGlobalButtons } from './utils/renderBar.js';
import { initializeAuth, AuthManager } from './utils/auth.js';
import { gebid } from './utils/gebid.js';
import { setVerifiedUsername } from './utils/verifiedBadge.js';

renderBar();
let socket;

async function loadSocketIO() {
    // Dynamically import socket.io-client from CDN for browser compatibility
    if (!window.io) {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    return window.io;
}

document.addEventListener("DOMContentLoaded", async function () {
    const homePanel = document.getElementById("messagePanel");
    const recipientAccountNumber = window.location.pathname.split('/')[2];
    // gebid is now imported from utils/gebid.js
    let accountNumber;

    try {
        const user = await initializeAuth();
        accountNumber = user.accountNumber;

        // Load socket.io-client from CDN and initialize socket
        const io = await loadSocketIO();
        socket = io();

        // Join DM room for this conversation
        socket.emit('joinDM', { user1: accountNumber, user2: recipientAccountNumber });

        // Listen for new DM messages
        socket.on('dmMessage', (msg) => {
            // Only append if the message is for this DM
            if ((msg.from === accountNumber && msg.to === recipientAccountNumber) ||
                (msg.from === recipientAccountNumber && msg.to === accountNumber)) {
                appendMessage({ 
                    messageId: msg.messageId,
                    from: msg.from, 
                    content: msg.message 
                }, accountNumber);
            }
        });

        // Listen for message deletions
        socket.on('messageDeleted', (data) => {
            // Only handle if the deletion is for this DM
            if ((data.from === accountNumber && data.to === recipientAccountNumber) ||
                (data.from === recipientAccountNumber && data.to === accountNumber)) {
                const messageElement = document.querySelector(`[data-message-id="${data.messageId}"]`);
                if (messageElement) {
                    // Animate removal
                    messageElement.style.transition = 'all 0.3s ease';
                    messageElement.style.transform = 'translateX(-100%)';
                    messageElement.style.opacity = '0';
                    
                    setTimeout(() => {
                        if (messageElement.parentNode) {
                            messageElement.parentNode.removeChild(messageElement);
                        }
                    }, 300);
                }
            }
        });

        fetchRecipientInfo(recipientAccountNumber);
        fetchAndRenderMessages(accountNumber, recipientAccountNumber);
        initializeGlobalButtons(accountNumber);
    } catch (error) {
        console.error("Error initializing auth:", error);
    }

    async function fetchRecipientInfo(recipientAccountNumber) {
        try {
            const accountNumber = recipientAccountNumber;
            const data = await apiRequest('/api/getUser', 'POST', { accountNumber: accountNumber }); // Send accountNumber as input
            if (data.success) {
                const recipient = data.user;

                const profileImage = gebid("profileImage");
                const profileName = gebid("profileName");
                const profileMeta = gebid('profileMeta');
                const profileLink = document.getElementById('openProfile');

                profileImage.src = recipient.pfp || "/src/default.png"; // Use default if no image
                setVerifiedUsername(profileName, recipient.username || "Unknown User", !!recipient.verified);

                if (profileMeta) {
                    const bioPreview = (recipient.bio || '').trim();
                    const tagline = bioPreview
                        ? `${bioPreview.length > 60 ? bioPreview.slice(0, 60).trim() + '…' : bioPreview}`
                        : `@${recipient.username || recipient.accountNumber}`;
                    profileMeta.textContent = tagline;
                    profileMeta.title = bioPreview || tagline;
                }

                if (profileLink) {
                    profileLink.href = `/profile/${recipient.accountNumber}`;
                }
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

        messages.forEach(message => {
            // Ensure messageId is included for existing messages
            appendMessage({
                messageId: message.messageId,
                from: message.from,
                content: message.content,
                sentAt: message.sentAt
            }, senderAccountNumber);
        });

        scrollToBottom();
    }

    function appendMessage(message, senderAccountNumber) {
        const messageDiv = document.createElement('div');
        messageDiv.className = message.from === senderAccountNumber ? 'message sent' : 'message received';
        messageDiv.textContent = message.content;
        
        // Add message ID as data attribute for deletion
        if (message.messageId) {
            messageDiv.setAttribute('data-message-id', message.messageId);
        }

        // Add delete functionality for sent messages only
        if (message.from === senderAccountNumber) {
            setupMessageDeletion(messageDiv, message.messageId, senderAccountNumber);
        }

        homePanel.appendChild(messageDiv);
        scrollToBottom();
    }

    function setupMessageDeletion(messageElement, messageId, senderAccountNumber) {
        let longPressTimer;
        let isLongPress = false;
        let startX, startY;

        const startLongPress = (e) => {
            isLongPress = false;
            startX = e.clientX || (e.touches && e.touches[0].clientX);
            startY = e.clientY || (e.touches && e.touches[0].clientY);
            
            // Add visual feedback
            messageElement.style.opacity = '0.7';
            messageElement.style.transform = 'scale(0.98)';
            
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                showDeleteConfirmation(messageElement, messageId, senderAccountNumber);
            }, 800); // 800ms for long press
        };

        const endLongPress = (e) => {
            clearTimeout(longPressTimer);
            
            // Remove visual feedback
            messageElement.style.opacity = '';
            messageElement.style.transform = '';
            
            // If it was a long press, prevent any other actions
            if (isLongPress) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        const cancelLongPress = (e) => {
            const currentX = e.clientX || (e.touches && e.touches[0].clientX);
            const currentY = e.clientY || (e.touches && e.touches[0].clientY);
            
            // Cancel if user moved too much (dragging)
            if (Math.abs(currentX - startX) > 10 || Math.abs(currentY - startY) > 10) {
                clearTimeout(longPressTimer);
                messageElement.style.opacity = '';
                messageElement.style.transform = '';
                isLongPress = false;
            }
        };

        // Mouse events
        messageElement.addEventListener('mousedown', startLongPress);
        messageElement.addEventListener('mouseup', endLongPress);
        messageElement.addEventListener('mouseleave', endLongPress);
        messageElement.addEventListener('mousemove', cancelLongPress);

        // Touch events for mobile
        messageElement.addEventListener('touchstart', startLongPress, { passive: true });
        messageElement.addEventListener('touchend', endLongPress, { passive: false });
        messageElement.addEventListener('touchcancel', endLongPress);
        messageElement.addEventListener('touchmove', cancelLongPress, { passive: true });
    }

    function showDeleteConfirmation(messageElement, messageId, senderAccountNumber) {
        // Create confirmation modal
        const modal = document.createElement('div');
        modal.className = 'delete-confirmation-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            backdrop-filter: blur(4px);
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: var(--card-bg, #1a1a1a);
            border: 1px solid var(--border-color, #333);
            border-radius: 12px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            color: var(--text-primary, white);
        `;

        const title = document.createElement('h3');
        title.textContent = 'Delete Message';
        title.style.cssText = `
            margin: 0 0 16px 0;
            font-size: 1.25rem;
            font-weight: 600;
        `;

        const message = document.createElement('p');
        message.textContent = 'Are you sure you want to delete this message? This action cannot be undone.';
        message.style.cssText = `
            margin: 0 0 24px 0;
            color: var(--text-secondary, #b3b3b3);
            line-height: 1.5;
        `;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 12px;
            justify-content: center;
        `;

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.style.cssText = `
            padding: 12px 24px;
            background: var(--secondary-bg, #2a2a2a);
            color: var(--text-primary, white);
            border: 1px solid var(--border-color, #333);
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;
        `;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.style.cssText = `
            padding: 12px 24px;
            background: var(--error-red, #f4212e);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;
        `;

        // Add hover effects
        cancelButton.addEventListener('mouseenter', () => {
            cancelButton.style.background = 'var(--hover-bg, #3a3a3a)';
        });
        cancelButton.addEventListener('mouseleave', () => {
            cancelButton.style.background = 'var(--secondary-bg, #2a2a2a)';
        });

        deleteButton.addEventListener('mouseenter', () => {
            deleteButton.style.background = '#d31e2a';
        });
        deleteButton.addEventListener('mouseleave', () => {
            deleteButton.style.background = 'var(--error-red, #f4212e)';
        });

        // Event listeners
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        deleteButton.addEventListener('click', async () => {
            document.body.removeChild(modal);
            await deleteMessage(messageId, messageElement, senderAccountNumber);
        });

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Assemble modal
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(deleteButton);
        modalContent.appendChild(title);
        modalContent.appendChild(message);
        modalContent.appendChild(buttonContainer);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }

    async function deleteMessage(messageId, messageElement, senderAccountNumber) {
        try {
            // Show loading state
            messageElement.style.opacity = '0.5';
            messageElement.style.pointerEvents = 'none';

            const response = await apiRequest(`/api/deleteMessage/${messageId}`, 'DELETE');
            
            if (response.success) {
                // Emit socket event for real-time deletion
                if (socket) {
                    socket.emit('deleteMessage', {
                        from: senderAccountNumber,
                        to: recipientAccountNumber,
                        messageId: messageId,
                        deletedBy: senderAccountNumber
                    });
                }
                
                // Remove the message element with animation
                messageElement.style.transition = 'all 0.3s ease';
                messageElement.style.transform = 'translateX(-100%)';
                messageElement.style.opacity = '0';
                
                setTimeout(() => {
                    if (messageElement.parentNode) {
                        messageElement.parentNode.removeChild(messageElement);
                    }
                }, 300);
            } else {
                // Restore element on failure
                messageElement.style.opacity = '';
                messageElement.style.pointerEvents = '';
                alert('Failed to delete message: ' + response.message);
            }
        } catch (error) {
            // Restore element on error
            messageElement.style.opacity = '';
            messageElement.style.pointerEvents = '';
            console.error('Error deleting message:', error);
            alert('Error deleting message. Please try again.');
        }
    }

    function scrollToBottom() {
        if (!homePanel) return;
        requestAnimationFrame(() => {
            homePanel.scrollTop = homePanel.scrollHeight;
        });
    }

    async function sendMessage(content) {
        try {
            // Send to backend for DB storage
            const data = await apiRequest('/api/sendMessage', 'POST', { to: recipientAccountNumber, content });
            if (data.success) {
                // Emit via socket.io for real-time update with messageId
                socket.emit('dmMessage', { 
                    from: accountNumber, 
                    to: recipientAccountNumber, 
                    message: content,
                    messageId: data.messageData.messageId
                });
            } else {
                console.error('Failed to send message:', data.message);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    // Create the send message box outside the homePanel
    function setupInputBox() {
        let inputContainer = document.querySelector('.inputContainer');
        if (!inputContainer) {
            const dmContainer = gebid('dmContainer');
            inputContainer = document.createElement('div');
            inputContainer.className = 'inputContainer';

            const messageInputEl = document.createElement('textarea');
            messageInputEl.id = 'messageInput';
            messageInputEl.placeholder = 'Type your message...';
            messageInputEl.rows = 1;
            messageInputEl.autocomplete = 'off';
            messageInputEl.autocapitalize = 'sentences';
            messageInputEl.spellcheck = true;

            const sendButtonEl = document.createElement('button');
            sendButtonEl.id = 'sendButton';
            sendButtonEl.type = 'button';
            sendButtonEl.setAttribute('aria-label', 'Send message');
            sendButtonEl.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/></svg><span>Send</span>';

            inputContainer.appendChild(messageInputEl);
            inputContainer.appendChild(sendButtonEl);
            dmContainer.appendChild(inputContainer);
        }

        const messageInput = gebid('messageInput');
        const sendButton = gebid('sendButton');
        if (!(messageInput && sendButton)) return;

        messageInput.setAttribute('rows', '1');
        messageInput.setAttribute('maxlength', '4000');

        const autoResize = () => {
            messageInput.style.height = 'auto';
            const minHeight = 48;
            const newHeight = Math.max(messageInput.scrollHeight, minHeight);
            messageInput.style.height = `${Math.min(newHeight, 240)}px`;
        };

        const handleSend = () => {
            const content = messageInput.value.trim();
            if (!content) return;
            sendMessage(content);
            messageInput.value = '';
            autoResize();
        };

        if (!sendButton.dataset.bound) {
            sendButton.addEventListener('click', handleSend);
            sendButton.dataset.bound = 'true';
        }

        if (!messageInput.dataset.bound) {
            messageInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                }
            });

            messageInput.addEventListener('input', autoResize);
            messageInput.addEventListener('focus', autoResize);
            messageInput.dataset.bound = 'true';
        }

        autoResize();
    }

    // Ensure the input box is set up after the DOM is loaded
    setupInputBox();
});