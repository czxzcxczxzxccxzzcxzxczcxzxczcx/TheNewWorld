document.addEventListener("DOMContentLoaded", function() {
    let accountNumber;

    fetch('/get-user-info', {
        method: 'GET',
        credentials: 'same-origin', 
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


    document.getElementById("profileButton").addEventListener("click", function(event) {
        event.preventDefault();
        if (accountNumber) {
            window.location.href = `/profile/${accountNumber}`;  // Redirect to user's profile page

        }
    });

    document.getElementById("logoutButton").addEventListener("click",function (event)
    {
        event.preventDefault();
        fetch('/logout', {
            method: 'POST',
            credentials: 'same-origin',  // Ensure cookies are sent with the request
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Redirect the user to the login page
                window.location.href = '/';
            } else {
                // Handle error (e.g., show a message to the user)
                alert('Logout failed. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error during logout:', error);
            alert('Something went wrong. Please try again later.');
        });
    })

    document.getElementById("createPostButton").addEventListener("click",function (event)
    {
        event.preventDefault();
        window.location.href = '/createPost';
    })



    document.getElementById('viewtest').addEventListener("click", function (event) 
    {
        fetch('/viewAllUsers', 
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },

            })
    });

    async function fetchPost(postId) {
        try {
            await fetch('/getPost', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ postId }), // Sending the postId to the server
            })
            .then(response => response.json()).then(data => 
            {
                let pfp = data.pfp;
                renderPost(data.post,data.username,pfp);
            });
        } catch (error) {
            console.error(error);
        }
    }
    
    async function renderPosts() {
        try {
            await fetch('/viewAllPosts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then(response => response.json()).then(data => 
            {
                data.posts.forEach((post) => {
                    fetchPost(post.postId);
                });

            });
        } catch (error) {
            console.error(error);
        }
    }

    function renderPost(post,username,pfp) {
        const homePanel = document.getElementById('homePanel');
        
        const postDiv = document.createElement('div');
        postDiv.classList.add('post');

        const postDetailsDiv = document.createElement('div');
        postDetailsDiv.classList.add('postDetails');

        const postImage = document.createElement('img');
        postImage.src = pfp;  // Add image URL if neededa
        postImage.classList.add('pfp');
        postImage.classList.add(username);
        postDetailsDiv.appendChild(postImage);       

        const titleH1 = document.createElement('h1');
        titleH1.textContent = `${username} (${post.accountNumber}) - ${post.title}`;//@${post.accountNumber} 
        postDetailsDiv.appendChild(titleH1);

        const postBodyDiv = document.createElement('div');
        postBodyDiv.classList.add('postBody');
        
        const contentP = document.createElement('p');
        contentP.textContent = post.content;
        postBodyDiv.appendChild(contentP);

        const dividerDiv = document.createElement('div');
        dividerDiv.classList.add('divider');

        const viewsH2 = document.createElement('h2');
        viewsH2.textContent = `${post.views} Views`;  // Replace with actual view count if available
        dividerDiv.appendChild(viewsH2);

        const likeButton = document.createElement('button');
        likeButton.type = 'submit';
        likeButton.classList.add('postButton');
        likeButton.textContent = 'Like';
        dividerDiv.appendChild(likeButton);

        const likeCounter = document.createElement('h2');
        likeCounter.classList.add('likeCounter');
        likeCounter.textContent = post.likes;  // Display like count from the post
        dividerDiv.appendChild(likeCounter);

        const repostButton = document.createElement('button');
        repostButton.type = 'submit';
        repostButton.classList.add('postButton');
        repostButton.textContent = 'Repost';
        dividerDiv.appendChild(repostButton);

        const repostCounter = document.createElement('h2');
        repostCounter.classList.add('likeCounter');
        repostCounter.textContent = post.reposts;  // Display repost count from the post
        dividerDiv.appendChild(repostCounter);

        postBodyDiv.appendChild(dividerDiv);

        postDiv.appendChild(postDetailsDiv);
        postDiv.appendChild(postBodyDiv);

        homePanel.appendChild(postDiv);

        // const images = document.getElementsByClassName(username);
        // images.forEach((element) => 
        // {
        //     element.addEventListener("click", function (event) 
        //     {
        //         window.location.href = '/test';

        //     })
        // });
    }

    renderPosts();
});
