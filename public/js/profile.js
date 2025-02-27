document.addEventListener("DOMContentLoaded", function() {
    const accountNumber = window.location.pathname.split('/')[2];
    var gebid =  document.getElementById.bind(document);
    let userAccountNumber;
    let followerCount

    fetch('/get-user-info', {
        method: 'GET',
        credentials: 'same-origin', 
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            window.location.href = '/';
            data.accountNumber = userAccountNumber;
        }
    })
    .catch(error => {
        console.error("Error fetching user info:", error);
    });

    gebid("logoutButton").addEventListener("click",function (event) {
        event.preventDefault();
        fetch('/logout', {
            method: 'POST',
            credentials: 'same-origin', 
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


    gebid('profileEdit').addEventListener("click",function (event) {
        event.preventDefault();
        const pfp = gebid("changePfp").textContent;
        const username = gebid("username").textContent;
        const bio = gebid("bio").textContent;
        const isEditable = gebid("bio").isContentEditable;
        
        if (isEditable) {
            changeEdit(false,"none","Edit Profile","","","")
            console.log(bio);
            fetch('/updateSettings', {
                method: 'POST', credentials: 'same-origin', 
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({bio, pfp, username})    
            })
        } else {
            changeEdit(true,"block","Save Profile",'1px dashed #ccc','1px dashed #ccc','1px dashed #ccc')
           
        }
    })

    gebid("createPostButton").addEventListener("click",function (event)
    {
        event.preventDefault();
        window.location.href = '/createPost';
    })

    function formatBio(bio) {
        return bio.replace(/\n/g, '<br>');
    }

    function changeEdit(edit,pfpDisplay,profileText,pfpText,bioBorder,userBorder) {
        const bioE = gebid("bio");
        const usernameE = gebid("username");
        const profileEditE = gebid("profileEdit");
        const changePfp = gebid("changePfp");
        const isEditable = bioE.isContentEditable;

        bioE.contentEditable = edit;
        changePfp.contentEditable = edit;
        usernameE.contentEditable = edit;
        changePfp.style.display = pfpDisplay;
        profileEditE.textContent = profileText;
        changePfp.style.border = pfpText;
        bioE.style.border = bioBorder;  
        usernameE.style.border = userBorder;


    }

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
        const editButton = document.createElement('button');

        postDetailsDiv.classList.add('postDetails');
        postImage.classList.add('pfp')
        postBodyDiv.classList.add('postBody');
        dividerDiv.classList.add('divider');
        likeButton.classList.add('postButton');
        likeCounter.classList.add('likeCounter');
        repostButton.classList.add('postButton');
        repostCounter.classList.add('likeCounter');
        editButton.classList.add('postButton');
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
        editButton.type = 'submit';
        editButton.textContent = 'Edit Post';
        

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
        dividerDiv.appendChild(editButton);

        homePanel.appendChild(postDiv);

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
    }

    fetch(`/api/profile/${accountNumber}`).then(response => response.json()).then(data => {
        let username = data.username;
        let pfp = data.pfp
        let postsCount = 0;

        fetch('/viewUserPosts', {
            method: 'POST',
            headers: {'Content-Type': 'application/json',},
            body: JSON.stringify({ accountNumber })  
        }).then(response => response.json()).then(data => {
        if (data.success) {
            data.posts.forEach((post) => {
                postsCount++;
                gebid('posts').textContent = ` ${postsCount} Posts`;
                renderPost(post,username,pfp);
                
            });
        }});
        
        gebid('username').textContent = `${data.username}`;
        gebid('pfp').src = pfp;
        gebid('accountnumber').textContent = ` (${data.accountNumber})`;
        // gebid('posts').textContent = ` ${postsCount} Posts`;

        const formattedBio = data.bio.replace(/\n/g, '<br>');
        console.log(data.bio)
    
        
        gebid('bio').textContent = `${data.bio}`;
        gebid('following').textContent = `${data.following} Following`;
        gebid('followers').textContent = ` ${data.followers} Followers`;
        gebid('changePfp').textContent = `${data.pfp}`;
       
    }).catch(error => console.error('Error fetching profile data:', error));
})
