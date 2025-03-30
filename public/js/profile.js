document.addEventListener("DOMContentLoaded", function() {
    const profileAccountNumber = window.location.pathname.split('/')[2];
    var gebid =  document.getElementById.bind(document);
    let userAccountNumber;
    let followerCount

    function changeEdit(edit,pfpDisplay,profileText,pfpText,bioBorder,userBorder) {
        const bioE = gebid("bio");
        const usernameE = gebid("username");
        const profileEditE = gebid("profileEdit");
        const changePfp = gebid("changePfp");

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
            await fetch('/api/changePostData', {
                method: 'POST',           
                headers: {
                    'Content-Type': 'application/json'   
                },
                body: JSON.stringify(requestBody)       
            });

        } catch (error) {
            console.error('Error during fetch:', error);
        }
    }

    function renderPost(post, username, pfp) {
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
        postImage.classList.add('pfp');
        postBodyDiv.classList.add('postBody');
        dividerDiv.classList.add('divider');
        likeButton.classList.add('postButton');
        likeButton.classList.add('likeButton');

        likeCounter.classList.add('likeCounter');
        repostButton.classList.add('postButton');
        repostCounter.classList.add('likeCounter');
        postDiv.classList.add('post');
        usernameTitle.classList.add('usernameTitle');
    
        postImage.src = pfp; 
        usernameTitle.textContent = `@${username} `;
        titleH1.textContent = `${post.title}`;
        contentP.textContent = post.content;
        viewsH2.textContent = `${post.views} Views`; 
        likeCounter.textContent = `${post.likes.length} likes`;
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
    
        const accountNumber = userAccountNumber; 
        const postId = post.postId; 
        
        fetch('/api/checkLike', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                postId: postId,
                accountNumber: accountNumber,
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.liked) {
                likeButton.textContent = 'Liked';
                likeButton.style.backgroundColor = "#777777";
            }
        })
        .catch(error => {
            console.error('Error liking post:', error);
        });

        likeButton.addEventListener("click", function(event) {
            fetch('/api/likePost', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    postId: postId,
                    accountNumber: accountNumber,
                }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if (data.removed == true) {
                        likeButton.textContent = 'Like';
                        likeButton.style.backgroundColor = "white";
                    } else {
                        likeButton.textContent = 'Liked';
                        likeButton.style.backgroundColor = "#777777";
                    }

                    fetch('/api/getPost', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({postId: postId,}),
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            likeCounter.textContent = `${data.post.likes.length} likes`; // Update the like count
                        }
                    })
                    .catch(error => {
                        console.error("Error fetching user info:", error);
                    });
                }
            })
            .catch(error => {
                console.error('Error liking post:', error);
            });
        });
    
        if (accountNumber == post.accountNumber)    {
            const editButton = document.createElement('button');
            editButton.type = 'submit';
            editButton.classList.add('postButton');
            editButton.classList.add('postEditButton');

            editButton.id = 'EditPost';

            editButton.textContent = 'Edit Post';
            editButton.setAttribute('data-id', post.postId);
            dividerDiv.appendChild(editButton);

            editButton.addEventListener("click", function (event) {
                const isEditable = contentP.isContentEditable;
                
                if (isEditable) {
                    contentP.contentEditable = false;
                    titleH1.contentEditable = false;
                    editButton.textContent = 'Edit';
                    contentP.style.border = '';  
                    titleH1.style.border = '';
                    updatePost(post.postId, titleH1.textContent, contentP.textContent);
                } else {
                    contentP.contentEditable = true; 
                    titleH1.contentEditable = true;
                    editButton.textContent = 'Save'; 
                    contentP.style.border = '1px dashed #ccc'; 
                    titleH1.style.border = '1px dashed #ccc';
                }
            });
        }
    }

    fetch('/api/getUserInfo', {
        method: 'GET',
        credentials: 'same-origin', 
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const user = data.user;  
            userAccountNumber = user.accountNumber;
        } else {
            window.location.href = '/';  
        }
    })
    .catch(error => {
        console.error("Error fetching user info:", error);
    });

    fetch(`/api/get/profile/${profileAccountNumber}`).then(response => response.json()).then(data => {
        let username = data.username;
        const accountNumber = profileAccountNumber;
        let pfp = data.pfp
        let postsCount = 0;

        if (userAccountNumber == accountNumber) {
            gebid('profileEdit').style.display = "block";
        }

        fetch('/api/getUserPosts', {
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
        gebid('bio').textContent = `${data.bio}`;
        gebid('following').textContent = `${data.following} Following`;
        gebid('followers').textContent = ` ${data.followers} Followers`;
        gebid('changePfp').textContent = `${data.pfp}`;
    }).catch(error => console.error('Error fetching profile data:', error));

    gebid("logoutButton").addEventListener("click",function (event) {
        event.preventDefault();
        fetch('/api/logout', {
            method: 'POST',
            credentials: 'same-origin', 
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/';
            } else {
                alert('Logout failed. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error during logout:', error);
            alert('Something went wrong. Please try again later.');
        });
    })

    gebid("profileButton").addEventListener("click", function(event) {
        event.preventDefault();
        if (userAccountNumber) {
            window.location.href = `/profile/${userAccountNumber}`;  // Redirect to user's profile page
        }
    });

    gebid('profileEdit').addEventListener("click",function (event) {
        event.preventDefault();
        const pfp = gebid("changePfp").textContent;
        const username = gebid("username").textContent;
        const bio = gebid("bio").textContent;
        const isEditable = gebid("bio").isContentEditable;
        
        if (isEditable) {
            changeEdit(false,"none","Edit Profile","","","")
            fetch('/api/updateSettings', {
                method: 'POST', credentials: 'same-origin', 
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({bio, pfp, username})    
            })
        } else {
            changeEdit(true,"block","Save Profile",'1px dashed #ccc','1px dashed #ccc','1px dashed #ccc')
        }
    })
})
