import { apiRequest } from './apiRequest.js';

export function initializeCreatePost(accountNumber) {
    const createPostDiv = document.createElement('div');
    createPostDiv.className = 'postPanel';
    createPostDiv.id = 'profilePanel';
    createPostDiv.style.display = 'none'; // Initially hidden
    createPostDiv.innerHTML = `
        <form>
            <h1 id="username">Create a Post</h1>
            
            <textarea class="bodyInput" id="bodyText" type="text" placeholder="Body"></textarea>
            <button id="createPost" type="submit" class="postPanelButton">Create Post</button>
            <input type="file" id="imageInput" accept="image/*" />
            <button id="uploadBtn" type="button">Upload Image</button>
            <div id="uploadResult"></div>
        </form>
    `; // <input class="titleInput" id="titleText" type="text" placeholder="Title">

    const body = document.body;
    body.insertBefore(createPostDiv, body.firstChild);

    const createPostButton = document.querySelector('a[href="/createPost"]');
    if (createPostButton) {
        createPostButton.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent navigation
            createPostDiv.style.display = createPostDiv.style.display === 'none' ? 'block' : 'none';
        });
    }

    // Image upload handler using apiRequest
    document.getElementById('uploadBtn').addEventListener('click', async function (event) {
        event.preventDefault();
        const input = document.getElementById('imageInput');
        const uploadResult = document.getElementById('uploadResult');
        if (!input.files.length) {
            uploadResult.textContent = 'Please select an image!';
            return;
        }
        const file = input.files[0];
        const formData = new FormData();
        formData.append('image', file);
        try {
            // Use apiRequest for file upload
            const data = await apiRequest('/api/uploadPostImage', 'POST', formData, true);
            if (data.success) {
                uploadResult.innerHTML = `<img src="${data.imageUrl}" style="max-width:200px;"><br>URL: <a href="${data.imageUrl}" target="_blank">${data.imageUrl}</a>`;
                window.uploadedImageUrl = data.imageUrl;
                // Insert <imageUrl> into the post body textarea
                const bodyText = document.getElementById('bodyText');
                if (bodyText) {
                    // Add a space if needed
                    if (bodyText.value && !bodyText.value.endsWith('\n')) bodyText.value += '\n';
                    bodyText.value += `<${data.imageUrl}>\n`;
                }
            } else {
                uploadResult.textContent = data.message;
            }
        } catch (err) {
            uploadResult.textContent = 'Upload failed.';
        }
    });

    document.getElementById('createPost').addEventListener('click', async function (event) {
        event.preventDefault();

        // const title = document.getElementById('titleText').value;
        const title = " ";
        const content = document.getElementById('bodyText').value;
        // Optionally include the uploaded image URL in the post content or as a separate field
        const imageUrl = window.uploadedImageUrl || null;

        if (title && content) {
            try {
                const data = await apiRequest('/api/createPost', 'POST', { accountNumber, title, content, imageUrl });
                if (data.success) {
                    window.location.href = `/profile/${accountNumber}`;
                }
            } catch (error) {
                console.error('Error creating post:', error);
            }
        }
    });
}