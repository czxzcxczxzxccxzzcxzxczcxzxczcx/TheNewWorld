document.addEventListener("DOMContentLoaded", function () {
    const profileAccountNumber = window.location.pathname.split('/')[2];
    var gebid = document.getElementById.bind(document);
    let userAccountNumber;

    async function apiRequest(url, method = 'GET', body = null) {
        const options = {method,headers: { 'Content-Type': 'application/json' },};

        if (body) {options.body = JSON.stringify(body);}

        try {
            const response = await fetch(url, options);
            return await response.json();
        } catch (error) {
            console.error(`Error during API request to ${url}:`, error);
            throw error;
        }
    }

    function changeEdit(edit, pfpDisplay, profileText, pfpText, bioBorder, userBorder) {
        bio.contentEditable = edit;
        changePfp.contentEditable = edit;
        username.contentEditable = edit;
        changePfp.style.display = pfpDisplay;
        profileEdit.textContent = profileText;
        changePfp.style.border = pfpText;
        bio.style.border = bioBorder;
        username.style.border = userBorder;
    }

    async function updatePost(postId, title, content) {
        try {
            const data = await apiRequest('/api/changePostData', 'POST', { postId, title, content });
            if (data.success) {
                console.log('Post updated successfully');
            } else {
                console.error('Failed to update post');
            }
        } catch (error) {
            console.error('Error updating post:', error);
        }
    }

    function renderPost(post, username, pfp) {
        const postDiv = createElementWithClass('div', 'post');
        const postDetailsDiv = createElementWithClass('div', 'postDetails');
        const postImage = createElementWithClass('img', 'pfp');
        const usernameTitle = createElementWithClass('h1', 'usernameTitle');
        const titleH1 = createElementWithClass('h1');
        const postBodyDiv = createElementWithClass('div', 'postBody');
        const contentP = createElementWithClass('p');
        const dividerDiv = createElementWithClass('div', 'divider');
        const viewsH2 = createElementWithClass('h2');
        const likeButton = createElementWithClass('button', 'postButton likeButton');
        const likeCounter = createElementWithClass('h2', 'likeCounter');
        const repostButton = createElementWithClass('button', 'postButton');
        const repostCounter = createElementWithClass('h2', 'likeCounter');

        // Set attributes and content
        postImage.src = pfp;
        usernameTitle.textContent = `@${username}`;
        titleH1.textContent = post.title;
        contentP.textContent = post.content;
        viewsH2.textContent = `${post.views} Views`;
        likeCounter.textContent = `${post.likes.length} likes`;
        repostCounter.textContent = post.reposts;
        likeButton.textContent = 'Like';
        likeButton.type = 'submit';
        repostButton.textContent = 'Repost';
        repostButton.type = 'submit';


        // Append elements to their parents
        postDetailsDiv.append(postImage, usernameTitle, titleH1);
        dividerDiv.append(viewsH2, likeButton, likeCounter, repostButton, repostCounter);
        postBodyDiv.append(contentP, dividerDiv);
        postDiv.append(postDetailsDiv, postBodyDiv);
        homePanel.appendChild(postDiv);

        // Setup likes functionality
        setupLikes(likeButton, likeCounter, post);

        // Check if the logged-in user owns the post
        if (userAccountNumber === post.accountNumber) {
            setupEditButton(dividerDiv, post, titleH1, contentP);
        }
    }

    // Utility function to create an element with a class
    function createElementWithClass(tag, className = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        return element;
    }

    function changeProfileEdit(edit,text,border,cE,tE,eE) {
        cE.contentEditable = edit;
        tE.contentEditable = edit;
        eE.textContent = text;
        cE.style.border = border;
        tE.style.border = border;
    }

    function setupEditButton(parent, post, titleElement, contentElement) {
        const editButton = createElementWithClass('button', 'postButton postEditButton');
        editButton.textContent = 'Edit Post';
        editButton.setAttribute('data-id', post.postId);

        editButton.addEventListener('click', () => {
            const isEditable = contentElement.isContentEditable;

            if (isEditable) {
                changeProfileEdit(false,'Edit Post','',contentElement,titleElement,editButton);
                updatePost(post.postId, titleElement.textContent, contentElement.textContent);
                console.log()
            } else {
                changeProfileEdit(true,'Save Post','1px dashed #ccc',contentElement,titleElement,editButton);
            }
        });
        parent.appendChild(editButton);
    }

    function setupLikes(likeButton, likeCounter, post) {
        const accountNumber = userAccountNumber;
        const postId = post.postId;

        // Check if the user has already liked the post
        apiRequest('/api/checkLike', 'POST', { postId, accountNumber })
            .then(data => {
                if (data.liked) {
                    likeButton.textContent = 'Liked';
                    likeButton.style.backgroundColor = "#777777";
                }
            })
            .catch(error => {
                console.error('Error checking like status:', error);
            });

        // Add event listener for liking/unliking the post
        likeButton.addEventListener("click", () => {
            apiRequest('/api/likePost', 'POST', { postId, accountNumber })
                .then(data => {
                    if (data.success) {
                        if (data.removed) {
                            likeButton.textContent = 'Like';
                            likeButton.style.backgroundColor = "white";
                        } else {
                            likeButton.textContent = 'Liked';
                            likeButton.style.backgroundColor = "#777777";
                        }
                        return apiRequest('/api/getPost', 'POST', { postId });
                    }
                })
                .then(data => {
                    if (data && data.success) {likeCounter.textContent = `${data.post.likes.length} likes`;}
                })
                .catch(error => {
                    console.error('Error liking post or fetching updated data:', error);
                });
        });
    }

    function setupPage() {
        apiRequest('/api/getUserInfo', 'GET')
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

        apiRequest(`/api/get/profile/${profileAccountNumber}`, 'GET')
            .then(data => {
                const username = data.username;
                const accountNumber = profileAccountNumber;
                const pfp = data.pfp;
                let postsCount = 0;

                if (userAccountNumber === accountNumber) {
                    gebid('profileEdit').style.display = "block";
                }

                apiRequest('/api/getUserPosts', 'POST', { accountNumber })
                    .then(data => {
                        if (data.success) {
                            data.posts.forEach(post => {
                                postsCount++;
                                gebid('posts').textContent = ` ${postsCount} Posts`;
                                renderPost(post, username, pfp);
                            });
                        }
                    });

                gebid('username').textContent = `${data.username}`;
                gebid('pfp').src = pfp;
                gebid('accountnumber').textContent = ` (${data.accountNumber})`;
                gebid('bio').textContent = `${data.bio}`;
                gebid('following').textContent = `${data.following} Following`;
                gebid('followers').textContent = ` ${data.followers} Followers`;
                gebid('changePfp').textContent = `${data.pfp}`;
            })
            .catch(error => console.error('Error fetching profile data:', error));
    }

    gebid("logoutButton").addEventListener("click", async function (event) {
        event.preventDefault();
        try {
            const data = await apiRequest('/api/logout', 'POST');
            if (data.success) {
                window.location.href = '/';
            } else {
                alert('Logout failed. Please try again.');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            alert('Something went wrong. Please try again later.');
        }
    });

    gebid("profileButton").addEventListener("click", function (event) {
        event.preventDefault();
        if (userAccountNumber) {
            window.location.href = `/profile/${userAccountNumber}`; // Redirect to user's profile page
        }
    });

    gebid('profileEdit').addEventListener("click", async function (event) {
        event.preventDefault();
        const pfp = gebid("changePfp").textContent;
        const username = gebid("username").textContent;
        const bio = gebid("bio").textContent.trim(); // Trim unnecessary whitespace
        const isEditable = gebid("bio").isContentEditable;

        if (isEditable) {
            changeEdit(false, "none", "Edit Profile", "", "", "");
            try {
                await apiRequest('/api/updateSettings', 'POST', { bio, pfp, username });
            } catch (error) {
                console.error('Error updating profile settings:', error);
            }
        } else {
            changeEdit(true, "block", "Save Profile", '1px dashed #ccc', '1px dashed #ccc', '1px dashed #ccc');
        }
    });

    setupPage();
});