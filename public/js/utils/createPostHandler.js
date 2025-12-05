import { apiRequest } from './apiRequest.js';
import { openGiphyPicker } from './giphyPicker.js';

export function initializeCreatePost(accountNumber) {
    const createPostDiv = document.createElement('div');
    createPostDiv.className = 'postPanel';
    createPostDiv.id = 'profilePanel';
    createPostDiv.style.display = 'none'; // Initially hidden
    createPostDiv.setAttribute('role', 'dialog');
    createPostDiv.setAttribute('aria-modal', 'true');
    createPostDiv.setAttribute('aria-hidden', 'true');
    createPostDiv.innerHTML = `
        <button type="button" class="postPanel-close" aria-label="Close create post panel">&times;</button>
        <form>
            <h1>Create a new post</h1>
            <textarea class="bodyInput" id="bodyText" placeholder="What's happening?"></textarea>
            <div id="postPreview"></div>

            <!-- Poll Section -->
            <div id="pollSection" hidden>
                <h3>Create Poll</h3>
                <input type="text" id="pollQuestion" class="poll-option" placeholder="Ask a question...">
                <div id="pollOptions" class="poll-options">
                    <input type="text" class="poll-option" placeholder="Option 1">
                    <input type="text" class="poll-option" placeholder="Option 2">
                </div>
                <div class="poll-controls">
                    <button type="button" id="addPollOption">+ Add Option</button>
                    <button type="button" id="removePollOption">- Remove</button>
                </div>
                <div class="poll-settings">
                    <label>
                        <input type="checkbox" id="allowMultipleVotes">
                        Allow multiple votes
                    </label>
                </div>
                <div class="poll-duration">
                    <span>Poll duration:</span>
                    <select id="pollDuration">
                        <option value="">No end time</option>
                        <option value="1">1 day</option>
                        <option value="3">3 days</option>
                        <option value="7">1 week</option>
                        <option value="30">1 month</option>
                    </select>
                </div>
            </div>

            <div class="actions-row">
                <button id="createPost" type="submit" class="postPanelButton">Create Post</button>
                <button id="togglePoll" type="button" class="postPanelButton secondary" aria-expanded="false">📊 Add Poll</button>
            </div>

            <div class="gifControls">
                <button id="openGifPicker" type="button" class="postPanelButton secondary">Add GIF</button>
                <div id="selectedGifPreview" class="gifPreview" aria-live="polite">No GIF selected</div>
            </div>

            <div class="imageUploading">
                <input type="file" id="imageInput" accept="image/*" hidden />
                <button id="uploadBtn" type="button">Upload Image</button>
            </div>
            <div id="uploadResult"></div>
        </form>
    `; // <input class="titleInput" id="titleText" type="text" placeholder="Title">

    const body = document.body;
    body.insertBefore(createPostDiv, body.firstChild);

    const bodyTextArea = createPostDiv.querySelector('#bodyText');
    const postPreview = createPostDiv.querySelector('#postPreview');
    const gifPreviewEl = createPostDiv.querySelector('#selectedGifPreview');
    const pollSection = createPostDiv.querySelector('#pollSection');
    const togglePollButton = createPostDiv.querySelector('#togglePoll');
    const pollOptionsContainer = createPostDiv.querySelector('#pollOptions');
    const addPollOptionBtn = createPostDiv.querySelector('#addPollOption');
    const removePollOptionBtn = createPostDiv.querySelector('#removePollOption');
    const allowMultipleVotesCheckbox = createPostDiv.querySelector('#allowMultipleVotes');
    const pollDurationSelect = createPostDiv.querySelector('#pollDuration');
    const uploadButton = createPostDiv.querySelector('#uploadBtn');
    const imageInput = createPostDiv.querySelector('#imageInput');
    const uploadResult = createPostDiv.querySelector('#uploadResult');
    const createPostButton = createPostDiv.querySelector('#createPost');
    const closeButton = createPostDiv.querySelector('.postPanel-close');

    const focusBodyInput = () => {
        if (bodyTextArea) {
            bodyTextArea.focus({ preventScroll: true });
        }
    };

    const handleEscape = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closePanel();
        }
    };

    const openPanel = () => {
        if (createPostDiv.classList.contains('open')) {
            focusBodyInput();
            return;
        }

        createPostDiv.style.display = 'flex';
        requestAnimationFrame(() => {
            createPostDiv.classList.add('open');
            focusBodyInput();
        });
        createPostDiv.setAttribute('aria-hidden', 'false');
        body.classList.add('panel-open', 'create-post-open');
        document.addEventListener('keydown', handleEscape);
    };

    const closePanel = () => {
        if (!createPostDiv.classList.contains('open')) {
            return;
        }

        createPostDiv.classList.remove('open');
        createPostDiv.setAttribute('aria-hidden', 'true');
        body.classList.remove('panel-open', 'create-post-open');
        document.removeEventListener('keydown', handleEscape);

        const onTransitionEnd = (event) => {
            if (event.target !== createPostDiv || event.propertyName !== 'opacity') {
                return;
            }
            createPostDiv.style.display = 'none';
            createPostDiv.removeEventListener('transitionend', onTransitionEnd);
        };

        createPostDiv.addEventListener('transitionend', onTransitionEnd);

        // Fallback in case transitionend doesn't fire
        setTimeout(() => {
            if (!createPostDiv.classList.contains('open')) {
                createPostDiv.style.display = 'none';
            }
        }, 260);
    };

    const togglePanel = () => {
        if (createPostDiv.classList.contains('open')) {
            closePanel();
        } else {
            openPanel();
        }
    };

    const createPostButtons = [
        document.getElementById('createPostButton'),
        document.getElementById('legacyCreatePostButton'),
        document.getElementById('bottomCreatePostButton')
    ].filter(Boolean);

    createPostButtons.forEach((button) => {
        button.addEventListener('click', function (event) {
            event.preventDefault();
            togglePanel();
        });
    });

    closeButton?.addEventListener('click', (event) => {
        event.preventDefault();
        closePanel();
    });

    // Poll functionality
    let pollEnabled = false;

    const syncPollUi = () => {
        if (!togglePollButton || !pollSection) {
            return;
        }

        togglePollButton.textContent = pollEnabled ? '❌ Remove Poll' : '📊 Add Poll';
        togglePollButton.classList.toggle('remove', pollEnabled);
        togglePollButton.setAttribute('aria-expanded', String(pollEnabled));
        pollSection.hidden = !pollEnabled;
    };

    togglePollButton?.addEventListener('click', () => {
        pollEnabled = !pollEnabled;
        syncPollUi();
    });

    addPollOptionBtn?.addEventListener('click', () => {
        if (!pollOptionsContainer) return;
        const optionCount = pollOptionsContainer.children.length;

        if (optionCount < 10) {
            const newOption = document.createElement('input');
            newOption.type = 'text';
            newOption.className = 'poll-option';
            newOption.placeholder = `Option ${optionCount + 1}`;
            pollOptionsContainer.appendChild(newOption);
        }
    });

    removePollOptionBtn?.addEventListener('click', () => {
        if (!pollOptionsContainer) return;
        const optionCount = pollOptionsContainer.children.length;

        if (optionCount > 2) {
            pollOptionsContainer.removeChild(pollOptionsContainer.lastChild);
        }
    });

    // Connect the button to the hidden file input
    uploadButton?.addEventListener('click', function(event) {
        event.preventDefault();
        imageInput?.click();
    });

    // Handle file selection
    imageInput?.addEventListener('change', async function() {
        if (!imageInput?.files?.length) {
            if (uploadResult) {
                uploadResult.textContent = 'No image selected';
                uploadResult.style.color = 'var(--text-muted)';
            }
            return;
        }

        const file = imageInput.files[0];
        const formData = new FormData();
        formData.append('image', file);

        try {
            // Use apiRequest for file upload
            const data = await apiRequest('/api/uploadPostImage', 'POST', formData, true);
            if (data.success) {
                window.uploadedImageUrl = data.imageUrl;
                if (uploadResult) {
                    uploadResult.textContent = 'Image uploaded successfully!';
                    uploadResult.style.color = '#4ade80';
                }

                // Insert <imageUrl> into the post body textarea
                if (bodyTextArea) {
                    if (bodyTextArea.value && !bodyTextArea.value.endsWith('\n')) bodyTextArea.value += '\n';
                    bodyTextArea.value += `<${data.imageUrl}>\n`;
                    updatePreview(); // Update preview after inserting image URL
                }
            } else {
                if (uploadResult) {
                    uploadResult.textContent = data.message;
                    uploadResult.style.color = '#f87171';
                }
            }
        } catch (err) {
            if (uploadResult) {
                uploadResult.textContent = 'Upload failed.';
                uploadResult.style.color = '#f87171';
            }
        }
    });

    let selectedGif = null;

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

    renderGifPreview();

    const gifButton = createPostDiv.querySelector('#openGifPicker');
    if (gifButton) {
        gifButton.addEventListener('click', () => {
            openGiphyPicker({
                onSelect: (gif) => {
                    selectedGif = gif;
                    renderGifPreview();
                    if (bodyTextArea && gif?.url && !bodyTextArea.value.includes(gif.url)) {
                        if (bodyTextArea.value && !bodyTextArea.value.endsWith('\n')) bodyTextArea.value += '\n';
                        bodyTextArea.value += `<${gif.url}>\n`;
                        updatePreview();
                    }
                }
            });
        });
    }

    createPostButton?.addEventListener('click', async function (event) {
        event.preventDefault();

        // const title = document.getElementById('titleText').value;
        const title = " ";
        let content = bodyTextArea?.value || '';
        
        // Prepare poll data if enabled
        let pollData = null;
        if (pollEnabled) {
            const pollQuestion = createPostDiv.querySelector('#pollQuestion')?.value || '';
            const pollOptionInputs = pollOptionsContainer?.querySelectorAll('.poll-option') || [];
            const pollOptions = Array.from(pollOptionInputs)
                .filter(input => input && typeof input.value === 'string') // Ensure input has a valid value property
                .map(input => ({ text: input.value.trim() }))
                .filter(option => option.text);
            
            const allowMultipleVotes = allowMultipleVotesCheckbox?.checked || false;
            const pollDuration = pollDurationSelect?.value;
            
            if (pollOptions.length >= 2) {
                pollData = {
                    isEnabled: true,
                    question: pollQuestion,
                    options: pollOptions,
                    allowMultipleVotes: allowMultipleVotes,
                    duration: pollDuration ? parseInt(pollDuration) : null
                };
            } else {
                alert('Please add at least 2 poll options.');
                return;
            }
        }
        
        // Validate content - allow posts with poll only, content only, or both
        if (selectedGif?.url && !content.includes(selectedGif.url)) {
            const separator = content.trim() ? '\n' : '';
            content = `${content}${separator}<${selectedGif.url}>`;
        }

        if ((content && content.trim()) || pollData) {
            try {
                const postData = { accountNumber, title, content };
                if (pollData) {
                    postData.poll = pollData;
                }
                if (selectedGif?.url) {
                    postData.imageUrl = selectedGif.url;
                }
                
                const data = await apiRequest('/api/createPost', 'POST', postData);
                if (data.success) {
                    window.location.href = `/profile/${accountNumber}`;
                }
            } catch (error) {
                console.error('Error creating post:', error);
            }
        } else {
            alert('Please add some content or create a poll.');
        }
    });

    // Live preview for <url> images in post body
    function processContent(content) {
        // Make mentions clickable
        function makeMentionsClickable(content) {
            return content.replace(/@([a-zA-Z0-9_]+)/g, '<a href="/profile/$1">@$1</a>');
        }
        let processedContent = makeMentionsClickable(content);
        const imgClass = 'post-image-responsive';
        const imgStyle = 'max-width:200px; height:auto; border-radius: 8px; margin: 10px 0;';
        
        // More flexible image detection that works with CloudFront URLs and other image hosting
        // First handle <URL> syntax for any image URL (including those without extensions)
        processedContent = processedContent.replace(/<\s*(https?:\/\/[^>\s]+)\s*>/gi, function(match, url) {
            // Check if it's likely an image URL (common image hosts or file extensions)
            if (url.match(/\.(png|jpg|jpeg|gif|webp|bmp|svg)(\?.*)?$/i) || 
                url.includes('cloudfront.net') || 
                url.includes('amazonaws.com') ||
                url.includes('post-images/')) {
                return `<img src="${url}" alt="User Image" class="${imgClass}" style="${imgStyle}">`;
            }
            // If not an image, treat as regular link
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });
        
        // Handle HTML-encoded brackets
        processedContent = processedContent.replace(/&lt;\s*(https?:\/\/[^&\s]+)\s*&gt;/gi, function(match, url) {
            if (url.match(/\.(png|jpg|jpeg|gif|webp|bmp|svg)(\?.*)?$/i) || 
                url.includes('cloudfront.net') || 
                url.includes('amazonaws.com') ||
                url.includes('post-images/')) {
                return `<img src="${url}" alt="User Image" class="${imgClass}" style="${imgStyle}">`;
            }
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });
        
        // Make remaining plain URLs clickable (but skip those already processed)
        processedContent = processedContent.replace(/(https?:\/\/[^\s<>'"()\[\]{}]+)/gi, function(url) {
            if (processedContent.includes(`<img src="${url}"`) || processedContent.includes(`<a href="${url}"`)) {
                return url;
            }
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });
        
        // Preserve line breaks
        processedContent = processedContent.replace(/\n/g, '<br>');
        return processedContent;
    }
    function updatePreview() {
        if (!postPreview || !bodyTextArea) return;
        postPreview.innerHTML = processContent(bodyTextArea.value);
    }
    bodyTextArea?.addEventListener('input', updatePreview);
    // Initial preview
    updatePreview();

    // Ensure UI reflects initial poll state
    syncPollUi();
}