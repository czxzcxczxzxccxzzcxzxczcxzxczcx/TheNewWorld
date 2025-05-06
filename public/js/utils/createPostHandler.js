import { apiRequest } from './apiRequest.js';

export function initializeCreatePost(accountNumber) {
    const createPostDiv = document.createElement('div');
    createPostDiv.className = 'postPanel';
    createPostDiv.id = 'profilePanel';
    createPostDiv.style.display = 'none'; // Initially hidden
    createPostDiv.innerHTML = `
        <form>
            <h1 id="username">Create a Post</h1>
            <input class="titleInput" id="titleText" type="text" placeholder="Title">
            <textarea class="bodyInput" id="bodyText" type="text" placeholder="Body"></textarea>
            <button id="createPost" type="submit" class="postPanelButton">Create Post</button>
        </form>
    `;

    const body = document.body;
    body.insertBefore(createPostDiv, body.firstChild);

    const createPostButton = document.querySelector('a[href="/createPost"]');
    if (createPostButton) {
        createPostButton.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent navigation
            createPostDiv.style.display = createPostDiv.style.display === 'none' ? 'block' : 'none';
        });
    }

    document.getElementById('createPost').addEventListener('click', async function (event) {
        event.preventDefault();

        const title = document.getElementById('titleText').value;
        const content = document.getElementById('bodyText').value;

        if (title && content) {
            try {
                const data = await apiRequest('/api/createPost', 'POST', { accountNumber, title, content });
                if (data.success) {
                    window.location.href = `/profile/${accountNumber}`;
                }
            } catch (error) {
                console.error('Error creating post:', error);
            }
        }
    });
}