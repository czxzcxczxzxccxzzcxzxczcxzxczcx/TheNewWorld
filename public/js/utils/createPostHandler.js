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
            <button id="createPost" type="submit" class="postPanelButton">Create Post</button>
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
        // Image URL is now handled within the content via <url> syntax, no separate field needed
        
        // Allow posts with just images or regular text content
        if (title && content.trim()) {
            try {
                const data = await apiRequest('/api/createPost', 'POST', { accountNumber, title, content });
                if (data.success) {
                    window.location.href = `/profile/${accountNumber}`;
                }
            } catch (error) {
                console.error('Error creating post:', error);
            }
        } else {
            alert('Please add some content to your post.');
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