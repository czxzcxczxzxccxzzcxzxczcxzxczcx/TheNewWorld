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
        fetch('/viewAllPosts', 
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },

            })
    });

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
            const response = await fetch('/viewAllPosts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
    
            const data = await response.json();
    
            // Check if data.posts is an array and if the request was successful
            if (data.success && Array.isArray(data.posts)) {
                // Sort posts by 'createdAt' (oldest first)
                data.posts.sort((a, b) => {
                    const dateA = new Date(a.createdAt);
                    const dateB = new Date(b.createdAt);
    
                    // Check if date is valid
                    if (isNaN(dateA) || isNaN(dateB)) {
                        console.error('Invalid date format:', a.createdAt, b.createdAt);
                        return 0;  // If date is invalid, leave order unchanged
                    }
    
                    // Return comparison (oldest first)
                    return dateA - dateB;
                });
    
                // Render the sorted posts
                data.posts.forEach((post) => {
                    fetchPost(post.postId);  // Assuming fetchPost handles rendering the post
                });
            } else {
                console.error('No posts found or data structure is invalid');
            }
    
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    }
    
    

    function renderPost(post,username,pfp) {
        const postDiv = document.createElement('div');
        const postDetailsDiv = document.createElement('div');
        const postImage = document.createElement('img');
        const usernameTitle = document.createElement('h1');
        const titleH1 = document.createElement('h1');
        const postBodyDiv = document.createElement('div');
        const contentP = document.createElement('p');
        const dividerDiv = document.createElement('div');
        const viewsH2 = document.createElement('h2');
        const likeButton = document.createElement('button');
        const likeCounter = document.createElement('h2');
        const repostButton = document.createElement('button');
        const repostCounter = document.createElement('h2');

        postDetailsDiv.classList.add('postDetails');
        postImage.classList.add('pfp')
        postBodyDiv.classList.add('postBody');
        dividerDiv.classList.add('divider');
        likeButton.classList.add('postButton');
        likeCounter.classList.add('likeCounter');
        repostButton.classList.add('postButton');
        repostCounter.classList.add('likeCounter');
        postDiv.classList.add('post');
        usernameTitle.classList.add('usernameTitle')
        
        postImage.src = pfp; 
        usernameTitle.textContent = `@${username} `;
        titleH1.textContent = `${post.title}`;
        contentP.textContent = post.content;
        viewsH2.textContent = `${post.views} Views`; 
        likeCounter.textContent = post.likes;
        repostCounter.textContent = post.reposts; 
        likeButton.textContent = 'Like';
        likeButton.type = 'submit';
        repostButton.type = 'submit';
        repostButton.textContent = 'Repost';
        

        postDiv.appendChild(postDetailsDiv);
        postDiv.appendChild(postBodyDiv);

        postDetailsDiv.appendChild(postImage);       
        postDetailsDiv.appendChild(usernameTitle);
        postDetailsDiv.appendChild(titleH1);

        postBodyDiv.appendChild(contentP);
        postBodyDiv.appendChild(dividerDiv);

        dividerDiv.appendChild(viewsH2);
        dividerDiv.appendChild(likeButton);
        dividerDiv.appendChild(likeCounter);
        dividerDiv.appendChild(repostButton);
        dividerDiv.appendChild(repostCounter);

        homePanel.appendChild(postDiv);

        if (accountNumber == post.accountNumber)
        {
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
            });
        }

        postImage.addEventListener("click",function (event)
        {
            window.location.href = `/profile/${post.accountNumber}`;  
        });
    }
    renderPosts();
});
