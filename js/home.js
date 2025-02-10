document.addEventListener("DOMContentLoaded", function() {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const homePanel = document.getElementById('homePanel');
    const accNumber = user.accNumber;
   
    if (!user) 
    {
        window.location.href = '/';  
        // loginPanel.style.display = 'flex';
    }

    document.getElementById("logoutButton").addEventListener("click",function (event)
    {
        event.preventDefault();
        sessionStorage.removeItem("user");
        window.location.href = '/';
    })

    document.getElementById("createPostButton").addEventListener("click",function (event)
    {
        event.preventDefault();
        window.location.href = '/createPost';
    })

    document.getElementById("profileButton").addEventListener("click",function (event)
    {
        event.preventDefault();
        window.location.href = `/profile/${accNumber}`;
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

        const images = document.getElementsByClassName(username);
        images.forEach((element) => 
        {
            element.addEventListener("click", function (event) 
            {
                window.location.href = '/test';

            })
        });
    }

    renderPosts();
});
