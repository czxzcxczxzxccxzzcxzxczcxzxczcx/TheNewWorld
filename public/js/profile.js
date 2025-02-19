document.addEventListener("DOMContentLoaded", function() {
    const accountNumber = window.location.pathname.split('/')[2];

    fetch('/get-user-info', {
        method: 'GET',
        credentials: 'same-origin', 
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            window.location.href = '/';
        }
    })
    .catch(error => {
        console.error("Error fetching user info:", error);
    });

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

    async function updatePost(postId, title, content) {
        const requestBody = {
            postId: postId,
            title: title,
            content: content
        };

        try {
            const response = await fetch('/changePostData', {
                method: 'POST',           
                headers: {
                    'Content-Type': 'application/json'   
                },
                body: JSON.stringify(requestBody)       
            });

            if (response.ok) {
                const data = await response.json(); 
                console.log('Post updated successfully:', data);
                alert('Post updated successfully!');
            } else {
                const errorData = await response.json();
                console.log('Error:', errorData.message);
                alert('Failed to update post: ' + errorData.message);
            }
        } catch (error) {
            console.error('Error during fetch:', error);
            alert('An error occurred while updating the post.');
        }
    }

    function renderPost(post,username,pfp) {

        // const post = document.querySelector('.post');
        // const postContainer = document.querySelector('.post-container');

        // const clonedPost1 = post.cloneNode(true);
        // const clonedPost2 = post.cloneNode(true);

        // postContainer.appendChild(clonedPost1);
        const postDiv = document.createElement('div');
        postDiv.classList.add('post');

        const postDetailsDiv = document.createElement('div');
        postDetailsDiv.classList.add('postDetails');
        
        const postImage = document.createElement('img');
        postImage.src = pfp;  // Add image URL if needed
        postImage.classList.add('pfp')
        postDetailsDiv.appendChild(postImage);       
    
        const usernameTitle = document.createElement('h1');
        usernameTitle.textContent = `${username}  -`;//@${post.accountNumber} 
        postDetailsDiv.appendChild(usernameTitle);

        const titleH1 = document.createElement('h1');
        titleH1.textContent = `${post.title}`;//@${post.accountNumber} 
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
        repostCounter.textContent = post.reposts;  
        dividerDiv.appendChild(repostCounter);

        const editButton = document.createElement('button');
        editButton.type = 'submit';
        editButton.classList.add('postButton');
        editButton.textContent = 'Edit Post';
        editButton.setAttribute('data-id', post.postId);
        dividerDiv.appendChild(editButton);


        editButton.addEventListener("click",function (event)
        {
            const isEditable = contentP.isContentEditable;

            if (isEditable) {
                contentP.contentEditable = false;
                titleH1.contentEditable = false;

                editButton.textContent = 'Edit';

                contentP.style.border = '';  
                titleH1.style.border = '';

                updatePost(post.postId,titleH1.textContent,contentP.textContent);
            } else {
                contentP.contentEditable = true; 
                titleH1.contentEditable = true;

                editButton.textContent = 'Save'; 
                contentP.style.border = '1px dashed #ccc'; 
                titleH1.style.border = '1px dashed #ccc';

            }
        })
        postBodyDiv.appendChild(dividerDiv);
        postDiv.appendChild(postDetailsDiv);
        postDiv.appendChild(postBodyDiv);
        homePanel.appendChild(postDiv);
    }

    fetch(`/api/profile/${accountNumber}`).then(response => response.json())
    .then(data => {
        var gebid =  document.getElementById.bind(document);
        let username = data.username;
        let pfp = data.pfp

        gebid('username').textContent = data.username;
        gebid('pfp').src = pfp;
        gebid('accountnumber').textContent = ` (${data.accountNumber})`;
        gebid('posts').textContent = ` ${data.posts} Posts`;
        gebid('bio').textContent = ` ${data.bio}`;
        gebid('following').textContent = `${data.following} Following`;
        gebid('followers').textContent = ` ${data.followers} Followers`;
        fetch('/viewUserPosts', {
            method: 'POST',
            headers: {'Content-Type': 'application/json',},
            body: JSON.stringify({ accountNumber })  
        }).then(response => response.json()).then(data => {
        if (data.success) {
            data.posts.forEach((post) => {
                renderPost(post,username,pfp);
            });
        }});
    }).catch(error => console.error('Error fetching profile data:', error));
})
