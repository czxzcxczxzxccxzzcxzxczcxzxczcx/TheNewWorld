import { apiRequest } from './apiRequest.js';

export function initializeCreatePost(accountNumber) {
    const createPostDiv = document.createElement('div');
    createPostDiv.className = 'postPanel';
    createPostDiv.id = 'profilePanel';
    createPostDiv.style.display = 'none'; // Initially hidden
    createPostDiv.innerHTML = `
        <form>
            <h1 id="username">Create A New Post</h1>
            
            <textarea class="bodyInput" id="bodyText" type="text" placeholder="Body"></textarea>
            <div id="postPreview" style="min-height:30px;margin-bottom:10px;"></div>
            
            <!-- Poll Section -->
            <div id="pollSection" style="display: none; margin: 15px 0; padding: 15px; border: 1px solid #333; border-radius: 8px; background: rgba(255,255,255,0.05);">
                <h3 style="margin: 0 0 10px 0; color: #fff;">Create Poll</h3>
                <input type="text" id="pollQuestion" placeholder="Ask a question..." style="width: 100%; padding: 8px; margin-bottom: 10px; background: #1a1a1a; border: 1px solid #333; border-radius: 4px; color: #fff;">
                
                <div id="pollOptions">
                    <input type="text" class="poll-option" placeholder="Option 1" style="width: 100%; padding: 8px; margin-bottom: 8px; background: #1a1a1a; border: 1px solid #333; border-radius: 4px; color: #fff;">
                    <input type="text" class="poll-option" placeholder="Option 2" style="width: 100%; padding: 8px; margin-bottom: 8px; background: #1a1a1a; border: 1px solid #333; border-radius: 4px; color: #fff;">
                </div>
                
                <div style="display: flex; gap: 10px; margin: 10px 0;">
                    <button type="button" id="addPollOption" style="padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">+ Add Option</button>
                    <button type="button" id="removePollOption" style="padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">- Remove</button>
                </div>
                
                <div style="margin: 10px 0;">
                    <label style="display: flex; align-items: center; color: #fff; font-size: 14px;">
                        <input type="checkbox" id="allowMultipleVotes" style="margin-right: 5px;">
                        Allow multiple votes
                    </label>
                </div>
                
                <div style="margin: 10px 0;">
                    <label style="color: #fff; font-size: 14px;">Poll Duration:</label>
                    <select id="pollDuration" style="margin-left: 10px; padding: 4px; background: #1a1a1a; border: 1px solid #333; border-radius: 4px; color: #fff;">
                        <option value="">No end time</option>
                        <option value="1">1 day</option>
                        <option value="3">3 days</option>
                        <option value="7">1 week</option>
                        <option value="30">1 month</option>
                    </select>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <button id="createPost" type="submit" class="postPanelButton">Create Post</button>
                <button id="togglePoll" type="button" style="padding: 10px 15px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">📊 Add Poll</button>
            </div>
            
            <div class="imageUploading">
                <input type="file" id="imageInput" accept="image/*" style="display: none;" />
                <button id="uploadBtn" type="button">Upload Image</button>
            </div>
            <div id="uploadResult"></div>
        </form>
    `; // <input class="titleInput" id="titleText" type="text" placeholder="Title">

    const body = document.body;
    body.insertBefore(createPostDiv, body.firstChild);

    const createPostButton = document.getElementById('createPostButton');
    if (createPostButton) {
        createPostButton.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent navigation
            createPostDiv.style.display = createPostDiv.style.display === 'none' ? 'block' : 'none';
        });
    }

    // Poll functionality
    let pollEnabled = false;
    
    document.getElementById('togglePoll').addEventListener('click', function() {
        pollEnabled = !pollEnabled;
        const pollSection = document.getElementById('pollSection');
        const toggleButton = document.getElementById('togglePoll');
        
        if (pollEnabled) {
            pollSection.style.display = 'block';
            toggleButton.textContent = '❌ Remove Poll';
            toggleButton.style.background = '#dc3545';
        } else {
            pollSection.style.display = 'none';
            toggleButton.textContent = '📊 Add Poll';
            toggleButton.style.background = '#28a745';
        }
    });

    document.getElementById('addPollOption').addEventListener('click', function() {
        const pollOptions = document.getElementById('pollOptions');
        const optionCount = pollOptions.children.length;
        
        if (optionCount < 10) {
            const newOption = document.createElement('input');
            newOption.type = 'text';
            newOption.className = 'poll-option';
            newOption.placeholder = `Option ${optionCount + 1}`;
            newOption.style.cssText = 'width: 100%; padding: 8px; margin-bottom: 8px; background: #1a1a1a; border: 1px solid #333; border-radius: 4px; color: #fff;';
            pollOptions.appendChild(newOption);
        }
    });

    document.getElementById('removePollOption').addEventListener('click', function() {
        const pollOptions = document.getElementById('pollOptions');
        const optionCount = pollOptions.children.length;
        
        if (optionCount > 2) {
            pollOptions.removeChild(pollOptions.lastChild);
        }
    });

    // Connect the button to the hidden file input
    document.getElementById('uploadBtn').addEventListener('click', function(event) {
        event.preventDefault();
        document.getElementById('imageInput').click();
    });

    // Handle file selection
    document.getElementById('imageInput').addEventListener('change', async function() {
        const input = document.getElementById('imageInput');
        const uploadResult = document.getElementById('uploadResult');
        if (!input.files.length) {
            uploadResult.textContent = 'No image selected';
            return;
        }
        
        const file = input.files[0];
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            // Use apiRequest for file upload
            const data = await apiRequest('/api/uploadPostImage', 'POST', formData, true);
            if (data.success) {
                window.uploadedImageUrl = data.imageUrl;
                uploadResult.textContent = 'Image uploaded successfully!';
                uploadResult.style.color = 'green';
                
                // Insert <imageUrl> into the post body textarea
                const bodyText = document.getElementById('bodyText');
                if (bodyText) {
                    // Add a space if needed
                    if (bodyText.value && !bodyText.value.endsWith('\n')) bodyText.value += '\n';
                    bodyText.value += `<${data.imageUrl}>\n`;
                    updatePreview(); // Update preview after inserting image URL
                }
            } else {
                uploadResult.textContent = data.message;
                uploadResult.style.color = 'red';
            }
        } catch (err) {
            uploadResult.textContent = 'Upload failed.';
            uploadResult.style.color = 'red';
        }
    });

    document.getElementById('createPost').addEventListener('click', async function (event) {
        event.preventDefault();

        // const title = document.getElementById('titleText').value;
        const title = " ";
        const content = document.getElementById('bodyText').value;
        
        // Prepare poll data if enabled
        let pollData = null;
        if (pollEnabled) {
            const pollQuestion = document.getElementById('pollQuestion')?.value || '';
            const pollOptionInputs = document.querySelectorAll('.poll-option');
            const pollOptions = Array.from(pollOptionInputs)
                .filter(input => input && typeof input.value === 'string') // Ensure input has a valid value property
                .map(input => ({ text: input.value.trim() }))
                .filter(option => option.text);
            
            const allowMultipleVotes = document.getElementById('allowMultipleVotes')?.checked || false;
            const pollDuration = document.getElementById('pollDuration')?.value;
            
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
        if ((content && content.trim()) || pollData) {
            try {
                const postData = { accountNumber, title, content };
                if (pollData) {
                    postData.poll = pollData;
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
    const bodyText = document.getElementById('bodyText');
    const postPreview = document.getElementById('postPreview');
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
        postPreview.innerHTML = processContent(bodyText.value);
    }
    bodyText.addEventListener('input', updatePreview);
    // Initial preview
    updatePreview();
}