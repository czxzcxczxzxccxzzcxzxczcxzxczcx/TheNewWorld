import { renderPost } from './utils/renderPost.js';
import { apiRequest } from './utils/apiRequest.js';
import { initializeCreatePost } from './utils/createPostHandler.js';
import { renderUsers } from './utils/renderUser.js';
import { renderBar } from './utils/renderBar.js';
import { initializeAuth } from './utils/auth.js';

renderBar();

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput"); // Input field for search
    const searchButton = document.getElementById("searchButton"); // Button to trigger search
    const searchUsers = document.getElementById("searchUsers"); // Button to trigger search
    const searchPanel = document.getElementById("searchpanel"); // Container to display results

    // Ensure all required elements exist
    if (!searchInput || !searchButton || !searchPanel) {
        alert("Required elements are missing from the DOM.");
        return;
    }

    initializeAuth()
        .then(user => {
            initializeCreatePost(user.accountNumber);
        })
        .catch(error => {
            console.error("Error initializing auth:", error);
        });

    // Function to perform search
    async function performSearch(query,type) {

        if (type === 'users') {
            try {
                const response = await apiRequest('/api/searchUsers', 'POST', { data: query }); // Use POST and send query in body
                // alert(`Response from search API: ${JSON.stringify(response)}`);
                if (response.success) {
                    console.log(response.users)
                    renderUsers(response.users, searchPanel); // Render the returned users
                } else {
                    searchPanel.innerHTML = `<p>No users found.</p>`;
                }
            } catch (error) {
                alert(`Error performing user search: ${error.message}`);
                searchPanel.innerHTML = `<p>Error fetching user search results. Please try again later.</p>`;
            }
            return;
        } else {

        
        try {
            const response = await apiRequest('/api/searchPosts', 'POST', { data: query }); // Use POST and send query in body
            if (response.success) {
                const postsWithUserData = await Promise.all(
                    response.posts.map(async (post) => {
                        const userResponse = await apiRequest('/api/getUser', 'POST', { accountNumber: post.accountNumber });
                        return {
                            ...post,
                            username: userResponse?.user?.username || 'Anonymous',
                            pfp: userResponse?.user?.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png',
                        };
                    })
                );
                displaySearchResults(postsWithUserData); // Display the returned posts with user data
            } else {
                searchPanel.innerHTML = `<p>No results found.</p>`;
            }
        } catch (error) {
            alert(`Error performing search: ${error.message}`);
            searchPanel.innerHTML = `<p>Error fetching search results. Please try again later.</p>`;
        }
        }
    }

    // Function to display search results
    function displaySearchResults(posts) {
        searchPanel.innerHTML = ""; // Clear previous results
        if (posts.length === 0) {
            searchPanel.innerHTML = "<p>No posts found.</p>";
            return;
        }

        posts.forEach(post => {
            try {
                renderPost(
                    post,
                    post.username || 'Anonymous', // Ensure username is passed correctly
                    post.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png', // Ensure pfp is passed correctly
                    post.accountNumber,
                    'search'
                ); // Render each post
            } catch (error) {
                alert(`Error rendering post: ${error.message}`);
            }
        });
    }

    // Add event listener to search button
    searchButton.addEventListener("click", () => {
        const query = searchInput.value.trim();
        // alert(`Search button clicked with query: ${query}`);
        if (query) {
            performSearch(query);
        } else {
            searchPanel.innerHTML = `<p>Please enter a search query.</p>`;
        }
    });

    searchUsers.addEventListener("click", () => {
        const query = searchInput.value.trim();
        // alert(`Search users button clicked with query: ${query}`);
        if (query) {
            performSearch(query,'users');
        } else {
            searchPanel.innerHTML = `<p>Please enter a search query.</p>`;
        }
    });
});
