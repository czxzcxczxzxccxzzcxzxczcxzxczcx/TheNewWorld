import { apiRequest } from './utils/apiRequest.js';
import { renderPost } from './utils/renderPost.js';
import { renderBar, initializeGlobalButtons } from './utils/renderBar.js';
import { initializeAuth, AuthManager } from './utils/auth.js';

renderBar();

document.addEventListener("DOMContentLoaded", async function () {
    const postContainer = document.getElementById("postContainer");
    let accountNumber;

    // Get the post ID from the URL
    const postId = window.location.pathname.split('/')[2];
    
    if (!postId) {
        postContainer.innerHTML = '<div class="error-message">Invalid post URL</div>';
        return;
    }

    // Get current user info for authentication and interaction features
    try {
        const user = await initializeAuth();
        accountNumber = user.accountNumber;
        initializeGlobalButtons(accountNumber);
    } catch (error) {
        console.error('Error initializing auth:', error);
        // Continue without user info - guest viewing
    }

    // Fetch and display the post
    try {
        const postData = await apiRequest(`/api/getPost/${postId}`, 'GET');
        
        if (postData.success) {
            const post = postData.post;
            
            // Get the post author's user data for profile info
            const authorData = await apiRequest('/api/getUser', 'POST', { accountNumber: post.accountNumber });
            
            if (authorData.success) {
                const author = authorData.user;
                
                // Clear container and render the post
                postContainer.innerHTML = '';
                
                // Use the existing renderPost function but modify the container
                renderPost(
                    post, 
                    author.username, 
                    author.pfp, 
                    accountNumber || null, 
                    'single', // Special context for single post view
                    accountNumber || null
                );
                
                // Update page title with post info
                document.title = `@${author.username} - ${post.content.substring(0, 50)}... - The New World`;
            } else {
                postContainer.innerHTML = '<div class="error-message">Post author not found</div>';
            }
        } else {
            postContainer.innerHTML = '<div class="error-message">Post not found</div>';
        }
    } catch (error) {
        console.error('Error fetching post:', error);
        postContainer.innerHTML = '<div class="error-message">Error loading post</div>';
    }

    // Admin verification is now handled globally in renderBar.js
});