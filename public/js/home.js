document.addEventListener("DOMContentLoaded", function () {
    let accountNumber;

    // Reusable API request function
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

    async function updatePost(postId, title, content) {
        try {
            const data = await apiRequest('/api/changePostData', 'POST', { postId, title, content });
            if (data.success) {
                console.log('Post updated successfully:', data);
                alert('Post updated successfully!');
            } else {
                console.error('Failed to update post:', data.message);
                alert('Failed to update post: ' + data.message);
            }
        } catch (error) {
            console.error('Error during fetch:', error);
            alert('An error occurred while updating the post.');
        }
    }

    async function fetchPost(postId) {
        try {
            const data = await apiRequest('/api/getPost', 'POST', { postId });
            if (data.success) {
                const pfp = data.pfp;
                renderPost(data.post, data.username, pfp);
            }
        } catch (error) {
            console.error('Error fetching post:', error);
        }
    }

    async function renderPosts() {
        try {
            const data = await apiRequest('/api/getAllPosts', 'POST');
            if (data.success && Array.isArray(data.posts)) {
                data.posts.sort((a, b) => {
                    const dateA = new Date(a.createdAt);
                    const dateB = new Date(b.createdAt);

                    if (isNaN(dateA) || isNaN(dateB)) {
                        console.error('Invalid date format:', a.createdAt, b.createdAt);
                        return 0;
                    }
                    return dateA - dateB;
                });

                data.posts.forEach((post) => {
                    fetchPost(post.postId);
                });
            } else {
                console.error('No posts found or data structure is invalid');
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
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
        postImage.classList.add('pfp', 'homeHover');
        postBodyDiv.classList.add('postBody');
        dividerDiv.classList.add('divider');
        likeButton.classList.add('postButton');
        likeCounter.classList.add('likeCounter');
        repostButton.classList.add('postButton');
        repostCounter.classList.add('likeCounter');
        postDiv.classList.add('post');
        usernameTitle.classList.add('usernameTitle');

        postImage.src = pfp;
        usernameTitle.textContent = `@${username}`;
        titleH1.textContent = post.title;
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

        setupLikes(likeButton, likeCounter, post);

        if (accountNumber === post.accountNumber) {setupEditButton(dividerDiv, post, titleH1, contentP);}

        postImage.addEventListener("click", function () {window.location.href = `/profile/${post.accountNumber}`;});
    }


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
            } else {
                changeProfileEdit(true,'Save Post','1px dashed #ccc',contentElement,titleElement,editButton);
            }
        });
        parent.appendChild(editButton);
    }

    function setupLikes(likeButton, likeCounter, post) {
        apiRequest('/api/checkLike', 'POST', { postId: post.postId, accountNumber })
        .then(data => {
            if (data.liked) {
                likeButton.textContent = 'Liked';
                likeButton.style.backgroundColor = "#777777";
            }
        })
        .catch(error => {
            console.error('Error checking like status:', error);
        });

        likeButton.addEventListener("click", async function () {
            try {
                const data = await apiRequest('/api/likePost', 'POST', { postId: post.postId, accountNumber });
                if (data.success) {
                    if (data.removed) {
                        likeButton.textContent = 'Like';
                        likeButton.style.backgroundColor = "white";
                    } else {
                        likeButton.textContent = 'Liked';
                        likeButton.style.backgroundColor = "#777777";
                    }

                    const updatedPost = await apiRequest('/api/getPost', 'POST', { postId: post.postId });
                    if (updatedPost.success) {likeCounter.textContent = `${updatedPost.post.likes.length} likes`;}
                }
            } catch (error) {
                console.error('Error liking post or fetching updated data:', error);
            }
        });   
    }

    apiRequest('/api/getUserInfo', 'GET')
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
        });

    document.getElementById("profileButton").addEventListener("click", function (event) {
        event.preventDefault();
        if (accountNumber) {window.location.href = `/profile/${accountNumber}`;}
    });

    document.getElementById("logoutButton").addEventListener("click", async function (event) {
        event.preventDefault();
        try {
            const data = await apiRequest('/api/logout', 'POST');
            if (data.success) {window.location.href = '/';}
        } catch (error) {
            console.error('Error during logout:', error);
        }
    });

    document.getElementById('viewtest').addEventListener("click", async function () {
        try {
            await apiRequest('/api/viewAllPosts', 'POST');
        } catch (error) {
            console.error('Error fetching all posts:', error);
        }
    });

    renderPosts();
});