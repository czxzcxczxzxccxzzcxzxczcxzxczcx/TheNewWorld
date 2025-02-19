document.addEventListener("DOMContentLoaded", function() {
    let accountNumber;
    
    fetch('/get-user-info', {
        method: 'GET',
        credentials: 'same-origin', // Ensure the cookie is sent with the request
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const user = data.user;  
            accountNumber = user.accountNumber;

        } else {
            window.location.href = '/';  
        }
    })
    .catch(error => {
        console.error("Error fetching user info:", error);
        window.location.href = '/';  
    });

    document.getElementById("logoutButton").addEventListener("click", function(event) {
        event.preventDefault();

        fetch('/logout', { method: 'POST' })  // Call your backend route to clear the cookie
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = '/'; // Redirect to homepage or login page
                }
            })
            .catch(error => {
                console.error('Logout error:', error);
            });
    });

    document.getElementById("profileButton").addEventListener("click", function(event) {
        event.preventDefault();
        window.location.href = `/profile/${accountNumber}`;  // Redirect to user's profile page
    });

    document.getElementById('createPost').addEventListener("click", function() {
        const title = document.getElementById("titleText").value;
        const content = document.getElementById("bodyText").value;
        

        if (title && content) {
            // Send the post request with accountNumber, title, and content
            fetch('/createPost', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accountNumber, title, content })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = '/home';  // Redirect to home after creating a post
                }
            })
            .catch(error => {
                console.error('Error creating post:', error);
            });
        }
    });

    // Handle checking posts
    document.getElementById('checkPost').addEventListener("click", function(event) {
        fetch('/viewAllPosts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => {
            // Process the posts data or update the UI accordingly
        })
        .catch(error => {
            console.error('Error checking posts:', error);
        });
    });
});
