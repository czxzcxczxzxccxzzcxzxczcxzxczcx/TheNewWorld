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

export function changeEdit(edit, pfpDisplay, profileText, pfpText, bioBorder, userBorder) {
    bio.contentEditable = edit;
    changePfp.contentEditable = edit;
    username.contentEditable = edit;
    changePfp.style.display = pfpDisplay;
    profileEdit.textContent = profileText;
    changePfp.style.border = pfpText;
    bio.style.border = bioBorder;
    username.style.border = userBorder;
}

export function changeFollow(text) {
    followbutton.contentEditable = edit;
}

export async function updatePost(postId, title, content) {
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

export function renderPost(post, username, pfp, accountNumber,from,fromAccountNumber) {
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
    const dateE = createElementWithClass('h2', 'date');
    const footerDiv = createElementWithClass('div', 'footer');
    const spaceDiv = createElementWithClass('div', 'spaceDiv');    // const deleteE = createElementWithClass('button', 'deleteButton');

    const formatDate = (dateString) => {
        const date = new Date(dateString);
    
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0'); 
        const day = date.getDate().toString().padStart(2, '0'); 
        const month = date.toLocaleString('en-US', { month: 'long' }); 
        const year = date.getFullYear();
    
        return `${hours}:${minutes} - ${month} ${day}  ${year}`;
    };
    // Set attributes and content
    postImage.src = pfp;
    postDiv.id = post.postId;
    usernameTitle.textContent = `@${username}`;
    titleH1.textContent = post.title;
    contentP.textContent = post.content;
    viewsH2.textContent = `${post.views} Views`;
    likeCounter.textContent = `${post.likes.length} likes`;
    repostCounter.textContent = `${ post.reposts.length} reposts`;
    likeButton.textContent = 'Like';
    likeButton.type = 'submit';
    repostButton.textContent = 'Repost';
    dateE.textContent = formatDate(post.createdAt);
    repostButton.type = 'submit';

    postDetailsDiv.append(postImage, usernameTitle, titleH1);
    dividerDiv.append(viewsH2, likeButton, likeCounter, repostButton, repostCounter);
    postBodyDiv.append(contentP, dividerDiv);
    postDiv.append(postDetailsDiv, postBodyDiv, spaceDiv,footerDiv);
    footerDiv.append(dateE, );

    if (from == 'home') { 
        homePanel.appendChild(postDiv);
     } else if (from == 'profile') {
        const profilePosts = document.getElementById('profilePosts');
        profilePosts.appendChild(postDiv);

     } else if (from == 'profilePosts') {
        const profileReposts = document.getElementById('profileReposts');
        console.log("appended")
        profileReposts.appendChild(postDiv);
     }



    setupLikes(likeButton, likeCounter, post, fromAccountNumber);
    setupReposts(repostButton, repostCounter, post, fromAccountNumber);
    if (post.accountNumber === fromAccountNumber) { 
        setupEditButton(footerDiv, post, titleH1, contentP); 
        // deleteE.addEventListener("click", () => {
        //     apiRequest('/api/deletePost', 'POST', { postId })
        //         .then(data => {
        //             if (data.success) {
        //                 console.log('Post deleted successfully');
        //                 homePanel.removeChild(postDiv);
        //             } else {
        //                 console.error('Failed to delete post');
        //             }
        //         })
        //         .catch(error => {console.error('Error deleting post:', error);});
        // }
        // );

    }
    if (from == 'home') {
        postImage.addEventListener("click", function (event) {
            window.location.href = `/profile/${post.accountNumber}`;  
        });
        postImage.classList.add("homeHover");

    }
}

export function createElementWithClass(tag, className = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    return element;
}

export function changeProfileEdit(edit, text, border, cE, tE, eE) {
    cE.contentEditable = edit;
    tE.contentEditable = edit;
    eE.textContent = text;
    cE.style.border = border;
    tE.style.border = border;
}

export function setupEditButton(parent, post, titleElement, contentElement) {
    const editButton = createElementWithClass('button', 'postButton postEditButton');
    editButton.textContent = 'Edit Post';
    editButton.setAttribute('data-id', post.postId);

    editButton.addEventListener('click', () => {
        const isEditable = contentElement.isContentEditable;

        if (isEditable) {
            changeProfileEdit(false, 'Edit Post', '', contentElement, titleElement, editButton);
            updatePost(post.postId, titleElement.textContent, contentElement.textContent);
            console.log()
        } else {
            changeProfileEdit(true, 'Save Post', '1px dashed #ccc', contentElement, titleElement, editButton);
        }
    });
    parent.appendChild(editButton);
}

export function setupLikes(likeButton, likeCounter, post, accountNumber) {
    const postId = post.postId;

    // Check if the user has already liked the post
    apiRequest('/api/checkLike', 'POST', { postId, accountNumber })
        .then(data => {
            if (data.liked) {
                likeButton.textContent = 'Liked';
                likeButton.style.backgroundColor = "#777777";
            }
        })
        .catch(error => {console.error('Error checking like status:', error);});

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
                if (data && data.success) { likeCounter.textContent = `${data.post.likes.length} likes`; }
            })
            .catch(error => {console.error('Error liking post or fetching updated data:', error);});
    });
}

export function setupReposts(repostButton, repostCounter, post, accountNumber) {
    const postId = post.postId;

    // Check if the user has already reposted the post
    apiRequest('/api/checkRepost', 'POST', { postId, accountNumber })
        .then(data => {
            if (data.reposted) {
                repostButton.textContent = 'Reposted';
                repostButton.style.backgroundColor = "#777777";
                console.log('Reposted');
            }
        })
        .catch(error => { console.error('Error checking repost status:', error); });

    // Add event listener for reposting/unreposting the post
    repostButton.addEventListener("click", () => {
        apiRequest('/api/repost', 'POST', { postId, accountNumber })
            .then(data => {
                if (data.success) {
                    if (data.removed) {
                        repostButton.textContent = 'Repost';
                        repostButton.style.backgroundColor = "white";
                    } else {
                        repostButton.textContent = 'Reposted';
                        repostButton.style.backgroundColor = "#777777";
                    }
                    // Fetch the updated repost count after the button is clicked
                    return apiRequest('/api/getPost', 'POST', { postId });
                }
            })
            .then(data => {
                if (data && data.success) { 
                    console.log(data.post.reposts);
                    repostCounter.textContent = `${data.post.reposts.length} reposts`; 
                }
            })
            .catch(error => { console.error('Error reposting post or fetching updated data:', error); });
    });
}