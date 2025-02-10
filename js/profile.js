document.addEventListener("DOMContentLoaded", function() {
    const accountNumber = window.location.pathname.split('/')[2];

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

    function renderPost(post,username,pfp) {
        const postDiv = document.createElement('div');
        postDiv.classList.add('post');

        const postDetailsDiv = document.createElement('div');
        postDetailsDiv.classList.add('postDetails');
        
        const postImage = document.createElement('img');
        postImage.src = pfp;  // Add image URL if needed
        postImage.classList.add('pfp')
        postDetailsDiv.appendChild(postImage);       
    
        const titleH1 = document.createElement('h1');
        titleH1.textContent = `${username} - ${post.title}`;//@${post.accountNumber} 
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
    }


    fetch(`/api/profile/${accountNumber}`).then(response => response.json()
    )
        .then(data => 
        {
            var gebid =  document.getElementById.bind(document);
            let username = data.username;
            let pfp = data.pfp

            gebid('username').textContent = data.username;
            gebid('accountnumber').textContent = ` (${data.accountNumber})`;
            gebid('posts').textContent = ` ${data.posts} Posts`;
            gebid('bio').textContent = ` ${data.bio}`;
            gebid('following').textContent = `${data.following} Following`;
            gebid('followers').textContent = ` ${data.followers} Followers`;
            fetch('/viewUserPosts', 
            {
                method: 'POST',
                headers: {'Content-Type': 'application/json',},
                body: JSON.stringify({ accountNumber })  
            }).then(response => response.json()).then(data => 
            {
                if (data.success) 
                {
                    data.posts.forEach((post) => {
                        renderPost(post,username,pfp);
                    });
                }
            });
        }
    ).catch(error => console.error('Error fetching profile data:', error));
})
