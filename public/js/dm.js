import { apiRequest } from './utils/apiRequest.js';
import { renderBar, initializeGlobalButtons } from './utils/renderBar.js';
import { initializeAuth } from './utils/auth.js';
import { gebid } from './utils/gebid.js';
import { setVerifiedUsername } from './utils/verifiedBadge.js';
import { openGiphyPicker } from './utils/giphyPicker.js';

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
    let selectedGif = null;
    let pendingAttachments = [];
    let gifPreviewEl;
    let gifPreviewImg;
    let removeGifButton;
    let gifButton;
    let attachmentPreviewEl;
    let attachmentInput;
    let attachmentButton;
    let attachmentUploadInProgress = false;

    const MAX_DM_ATTACHMENTS = 4;

    function renderGifPreview() {
        if (!gifPreviewEl) return;

        const hasGif = !!(selectedGif && selectedGif.url);
        gifPreviewEl.hidden = !hasGif;

        if (!hasGif) {
            if (gifPreviewImg) {
                gifPreviewImg.src = '';
                gifPreviewImg.alt = 'No GIF selected';
            }
            if (gifButton) {
                gifButton.classList.remove('active');
                gifButton.setAttribute('aria-pressed', 'false');
            }
            return;
        }

        if (gifPreviewImg) {
            gifPreviewImg.src = selectedGif.preview || selectedGif.url;
            gifPreviewImg.alt = selectedGif.title || 'Selected GIF';
        }
        if (gifButton) {
            gifButton.classList.add('active');
            gifButton.setAttribute('aria-pressed', 'true');
        }
    }

    function renderAttachmentPreview() {
        if (!attachmentPreviewEl) return;

        attachmentPreviewEl.innerHTML = '';
        if (!pendingAttachments.length) {
            attachmentPreviewEl.hidden = true;
            return;
        }

        pendingAttachments.forEach((attachment, index) => {
            if (!attachment || !attachment.url) return;

            const item = document.createElement('div');
            item.className = 'dm-attachment-item';

            const img = document.createElement('img');
            img.src = attachment.preview || attachment.url;
            img.alt = attachment.alt || 'Selected attachment';
            img.loading = 'lazy';
            item.appendChild(img);

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'dm-attachment-remove';
            removeBtn.setAttribute('aria-label', 'Remove attachment');
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', () => {
                pendingAttachments.splice(index, 1);
                renderAttachmentPreview();
                updateAttachmentButtonState();
            });
            item.appendChild(removeBtn);

            attachmentPreviewEl.appendChild(item);
        });

        attachmentPreviewEl.hidden = false;
    }

    function updateAttachmentButtonState() {
        if (!attachmentButton) return;
        const isFull = pendingAttachments.length >= MAX_DM_ATTACHMENTS;
        attachmentButton.disabled = isFull || attachmentUploadInProgress;
        attachmentButton.classList.toggle('disabled', attachmentButton.disabled);
        attachmentButton.setAttribute('aria-disabled', attachmentButton.disabled ? 'true' : 'false');
    }

    async function handleAttachmentSelection(fileList) {
        if (!attachmentInput || !attachmentPreviewEl) return;
        if (!fileList || !fileList.length) {
            attachmentInput.value = '';
            return;
        }

        const availableSlots = MAX_DM_ATTACHMENTS - pendingAttachments.length;
        if (availableSlots <= 0) {
            alert(`You can attach up to ${MAX_DM_ATTACHMENTS} images per message.`);
            attachmentInput.value = '';
            return;
        }

        const files = Array.from(fileList)
            .filter(file => file && file.type && file.type.startsWith('image/'))
            .slice(0, availableSlots);

        if (!files.length) {
            alert('Please choose an image file to upload.');
            attachmentInput.value = '';
            return;
        }

        attachmentUploadInProgress = true;
        updateAttachmentButtonState();

        if (!pendingAttachments.length) {
            attachmentPreviewEl.hidden = false;
            attachmentPreviewEl.innerHTML = '<span class="dm-attachment-status">Uploading image…</span>';
        } else {
            const statusEl = document.createElement('span');
            statusEl.className = 'dm-attachment-status';
            statusEl.textContent = 'Uploading image…';
            attachmentPreviewEl.appendChild(statusEl);
        }

        for (const file of files) {
            const formData = new FormData();
            formData.append('image', file);

            try {
                const data = await apiRequest('/api/uploadPostImage', 'POST', formData, true);
                if (data?.success && data.imageUrl) {
                    pendingAttachments.push({
                        url: data.imageUrl,
                        type: 'image',
                        alt: file.name || 'Uploaded image'
                    });
                    renderAttachmentPreview();
                } else {
                    const message = data?.message || 'Failed to upload image.';
                    alert(message);
                }
            } catch (error) {
                console.error('Error uploading DM attachment:', error);
                alert('Image upload failed. Please try again.');
            }
        }

        attachmentUploadInProgress = false;
        updateAttachmentButtonState();

        if (!pendingAttachments.length) {
            attachmentPreviewEl.hidden = true;
            attachmentPreviewEl.innerHTML = '';
        } else {
            renderAttachmentPreview();
        }

        attachmentInput.value = '';
    }

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
                    content: msg.message,
                    gifUrl: msg.gifUrl,
                    attachments: msg.attachments
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
                attachments: message.attachments,
                gifUrl: message.gifUrl,
                sentAt: message.sentAt
            }, senderAccountNumber);
        });

        scrollToBottom();
    }

    function appendMessage(message, senderAccountNumber) {
        const messageDiv = document.createElement('div');
        messageDiv.className = message.from === senderAccountNumber ? 'message sent' : 'message received';
        const contentBlock = document.createElement('div');
        contentBlock.className = 'message-content';
        let hasVisibleContent = false;

        if (message.content && message.content.trim()) {
            const textEl = document.createElement('span');
            textEl.className = 'message-text';
            textEl.textContent = message.content;
            contentBlock.appendChild(textEl);
            hasVisibleContent = true;
        }

        if (message.gifUrl) {
            const gifWrapper = document.createElement('div');
            gifWrapper.className = 'message-gif';
            const img = document.createElement('img');
            img.src = message.gifUrl;
            img.alt = 'GIF';
            img.loading = 'lazy';
            gifWrapper.appendChild(img);
            contentBlock.appendChild(gifWrapper);
            hasVisibleContent = true;
        }

        if (Array.isArray(message.attachments) && message.attachments.length) {
            const attachmentsContainer = document.createElement('div');
            attachmentsContainer.className = 'message-attachments';

            message.attachments.forEach((attachment) => {
                if (!attachment || !attachment.url) return;
                const attachmentItem = document.createElement('div');
                attachmentItem.className = 'message-attachment';

                const attachmentImg = document.createElement('img');
                attachmentImg.src = attachment.url;
                attachmentImg.alt = attachment.alt || 'Message attachment';
                attachmentImg.loading = 'lazy';
                attachmentItem.appendChild(attachmentImg);

                attachmentsContainer.appendChild(attachmentItem);
            });

            if (attachmentsContainer.childElementCount) {
                contentBlock.appendChild(attachmentsContainer);
                hasVisibleContent = true;
            }
        }

        if (!hasVisibleContent) {
            const textEl = document.createElement('span');
            textEl.className = 'message-text';
            textEl.textContent = '';
            contentBlock.appendChild(textEl);
        }

        messageDiv.appendChild(contentBlock);
        
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

    async function sendMessage({ content, gifUrl, attachments }) {
        try {
            const payload = {
                to: recipientAccountNumber,
                content,
                gifUrl,
                attachments
            };

            // Send to backend for DB storage
            const data = await apiRequest('/api/sendMessage', 'POST', payload);
            if (data.success) {
                const sentMessage = data.messageData;
                // Emit via socket.io for real-time update with messageId
                socket.emit('dmMessage', { 
                    from: accountNumber, 
                    to: recipientAccountNumber, 
                    message: sentMessage.content,
                    gifUrl: sentMessage.gifUrl,
                    attachments: sentMessage.attachments,
                    messageId: sentMessage.messageId,
                    sentAt: sentMessage.sentAt
                });
                return true;
            } else {
                console.error('Failed to send message:', data.message);
                return false;
            }
        } catch (error) {
            console.error('Error sending message:', error);
            return false;
        }
    }

    // Create the send message box outside the homePanel
    function setupInputBox() {
        let inputContainer = document.querySelector('.inputContainer');
        if (!inputContainer) {
            const dmContainer = gebid('dmContainer');
            inputContainer = document.createElement('div');
            inputContainer.className = 'inputContainer';

            const gifButtonEl = document.createElement('button');
            gifButtonEl.id = 'gifButton';
            gifButtonEl.type = 'button';
            gifButtonEl.className = 'composerIconButton';
            gifButtonEl.setAttribute('aria-label', 'Add GIF');
            gifButtonEl.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm0-2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3H5zm4.5 11H7v2H5V9h4.5v2H7v2h2.5v2zm2.5-4h2a2 2 0 0 1 0 4h-1v2h-1.5V7zm1.5 3a.5.5 0 0 0 0-1H12v1h1zm4.5-3h-4v8H18v-2h-2.5V7H18V5z" fill="currentColor"/></svg>';

            const composerInputWrap = document.createElement('div');
            composerInputWrap.className = 'composerInputWrap';

            const messageInputEl = document.createElement('textarea');
            messageInputEl.id = 'messageInput';
            messageInputEl.placeholder = 'Type your message...';
            messageInputEl.rows = 1;
            messageInputEl.autocomplete = 'off';
            messageInputEl.autocapitalize = 'sentences';
            messageInputEl.spellcheck = true;
            composerInputWrap.appendChild(messageInputEl);

            const gifPreviewContainer = document.createElement('div');
            gifPreviewContainer.id = 'gifPreview';
            gifPreviewContainer.className = 'dm-gif-preview';
            gifPreviewContainer.hidden = true;

            const gifImg = document.createElement('img');
            gifImg.alt = 'Selected GIF preview';
            gifImg.loading = 'lazy';
            gifPreviewContainer.appendChild(gifImg);

            const removeButtonEl = document.createElement('button');
            removeButtonEl.type = 'button';
            removeButtonEl.id = 'removeGifButton';
            removeButtonEl.className = 'remove-gif';
            removeButtonEl.setAttribute('aria-label', 'Remove GIF');
            removeButtonEl.textContent = '×';
            gifPreviewContainer.appendChild(removeButtonEl);

            composerInputWrap.appendChild(gifPreviewContainer);

            const sendButtonEl = document.createElement('button');
            sendButtonEl.id = 'sendButton';
            sendButtonEl.type = 'button';
            sendButtonEl.setAttribute('aria-label', 'Send message');
            sendButtonEl.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/></svg><span>Send</span>';

            inputContainer.appendChild(gifButtonEl);
            inputContainer.appendChild(composerInputWrap);
            inputContainer.appendChild(sendButtonEl);
            dmContainer.appendChild(inputContainer);
        }

        const messageInput = gebid('messageInput');
        const sendButton = gebid('sendButton');
        gifButton = gebid('gifButton');
        gifPreviewEl = gebid('gifPreview');
        gifPreviewImg = gifPreviewEl ? gifPreviewEl.querySelector('img') : null;
        removeGifButton = gebid('removeGifButton');
    attachmentPreviewEl = document.getElementById('attachmentPreview');
    attachmentInput = document.getElementById('attachmentInput');
    attachmentButton = document.getElementById('attachmentButton');

    updateAttachmentButtonState();
    renderAttachmentPreview();

        if (!(messageInput && sendButton)) return;

        messageInput.setAttribute('rows', '1');
        messageInput.setAttribute('maxlength', '4000');

        const autoResize = () => {
            messageInput.style.height = 'auto';
            const minHeight = 48;
            const newHeight = Math.max(messageInput.scrollHeight, minHeight);
            messageInput.style.height = `${Math.min(newHeight, 240)}px`;
        };

        const handleSend = async () => {
            const content = messageInput.value.trim();
            const gifUrl = selectedGif?.url || '';
            const attachmentsPayload = pendingAttachments.map((attachment) => ({
                url: attachment.url,
                type: attachment.type || 'image'
            }));

            if (!content && !gifUrl && !attachmentsPayload.length) {
                return;
            }

            const wasSent = await sendMessage({ content, gifUrl, attachments: attachmentsPayload });
            if (wasSent) {
                messageInput.value = '';
                selectedGif = null;
                pendingAttachments = [];
                renderGifPreview();
                renderAttachmentPreview();
                updateAttachmentButtonState();
                if (attachmentInput) {
                    attachmentInput.value = '';
                }
                autoResize();
            }
        };

        if (!sendButton.dataset.bound) {
            sendButton.addEventListener('click', () => {
                handleSend();
            });
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

        if (gifButton && !gifButton.dataset.bound) {
            gifButton.addEventListener('click', () => {
                try {
                    openGiphyPicker({
                        onSelect(gif) {
                            selectedGif = {
                                url: gif.url,
                                preview: gif.preview,
                                title: gif.title
                            };
                            renderGifPreview();
                            messageInput.focus();
                        }
                    });
                } catch (error) {
                    console.error('Error opening GIF picker:', error);
                }
            });
            gifButton.dataset.bound = 'true';
            gifButton.setAttribute('aria-pressed', 'false');
        }

        if (removeGifButton && !removeGifButton.dataset.bound) {
            removeGifButton.addEventListener('click', () => {
                selectedGif = null;
                renderGifPreview();
                messageInput.focus();
            });
            removeGifButton.dataset.bound = 'true';
        }

        if (attachmentButton && !attachmentButton.dataset.bound) {
            attachmentButton.addEventListener('click', () => {
                if (attachmentButton.disabled) return;
                if (attachmentInput) {
                    attachmentInput.click();
                }
            });
            attachmentButton.dataset.bound = 'true';
        }

        if (attachmentInput && !attachmentInput.dataset.bound) {
            attachmentInput.addEventListener('change', async (event) => {
                await handleAttachmentSelection(event.target?.files);
            });
            attachmentInput.dataset.bound = 'true';
        }

        renderGifPreview();
        autoResize();
    }

    // Ensure the input box is set up after the DOM is loaded
    setupInputBox();
});