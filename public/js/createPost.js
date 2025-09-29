import { apiRequest } from './utils/apiRequest.js';
import { initializeGlobalButtons } from './utils/renderBar.js';
import { openGiphyPicker } from './utils/giphyPicker.js';

document.addEventListener("DOMContentLoaded", function () {
    let accountNumber;
    let selectedGif = null;

    document.getElementById("profilePanel").style.display = "flex";

    // Admin verification is now handled globally in renderBar.js
    // Fetch user info
    async function fetchUserInfo() {
        try {
            const data = await apiRequest('/api/getUserInfo', 'GET');
            if (data.success) {
                const user = data.user;
                accountNumber = user.accountNumber;
                initializeGlobalButtons(accountNumber); // Initialize global buttons
            } else {
                window.location.href = '/';
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
            window.location.href = '/';
        }
    }

    const gifPreviewEl = document.getElementById('selectedGifPreview');
    const bodyInput = document.getElementById('bodyText');

    function renderGifPreview() {
        if (!gifPreviewEl) return;
        gifPreviewEl.innerHTML = '';

        if (!selectedGif?.url) {
            gifPreviewEl.textContent = 'No GIF selected';
            return;
        }

        const img = document.createElement('img');
        img.src = selectedGif.preview || selectedGif.url;
        img.alt = selectedGif.title || 'Selected GIF';
        gifPreviewEl.appendChild(img);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'postPanelButton secondary';
        removeBtn.textContent = 'Remove GIF';
        removeBtn.addEventListener('click', () => {
            selectedGif = null;
            renderGifPreview();
        });
        gifPreviewEl.appendChild(removeBtn);
    }

    const gifButton = document.getElementById('openGifPicker');
    if (gifButton) {
        gifButton.addEventListener('click', () => {
            openGiphyPicker({
                onSelect: (gif) => {
                    selectedGif = gif;
                    renderGifPreview();
                    if (bodyInput && gif?.url && !bodyInput.value.includes(gif.url)) {
                        if (bodyInput.value && !bodyInput.value.endsWith('\n')) {
                            bodyInput.value += '\n';
                        }
                        bodyInput.value += `<${gif.url}>\n`;
                    }
                }
            });
        });
    }

    renderGifPreview();

    // Create a new post
    document.getElementById('createPost').addEventListener("click", async function (event) {
        event.preventDefault();

        const title = document.getElementById("titleText").value;
        let content = bodyInput.value || '';

        if (selectedGif?.url && !content.includes(selectedGif.url)) {
            const separator = content.trim() ? '\n' : '';
            content = `${content}${separator}<${selectedGif.url}>`;
        }

        if (title && content.trim()) {
            try {
                const payload = {
                    accountNumber,
                    title,
                    content
                };

                if (selectedGif?.url) {
                    payload.imageUrl = selectedGif.url;
                }

                const data = await apiRequest('/api/createPost', 'POST', payload);
                if (data.success) {
                    window.location.href = `/profile/${accountNumber}`;
                }
            } catch (error) {
                console.error('Error creating post:', error);
            }
        } else {
            alert('Please add a title and some content or a GIF.');
        }
    });

    // Check all posts
    document.getElementById('checkPost').addEventListener("click", async function () {
        try {
            const data = await apiRequest('/api/getAllPosts', 'POST');
        } catch (error) {
            console.error('Error checking posts:', error);
        }
    });

    fetchUserInfo();
});