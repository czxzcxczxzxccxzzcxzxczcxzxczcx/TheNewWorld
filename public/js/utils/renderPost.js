function formatDate(dateString) {
    const date = new Date(dateString);

    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();

    return `${hours}:${minutes} - ${month} ${day} ${year}`;
}

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

export function renderPost(post, username, pfp, accountNumber, from, fromAccountNumber) {
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
    const spaceDiv2 = createElementWithClass('div', 'spaceDiv');

    const displayUsername = username || post.username || 'Anonymous';
    const displayPfp = pfp || post.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png';

    setPostAttributes(
        postDetailsDiv,
        postImage,
        usernameTitle,
        titleH1,
        postBodyDiv,
        contentP,
        dividerDiv,
        viewsH2,
        likeButton,
        likeCounter,
        repostButton,
        repostCounter,
        dateE,
        post,
        displayUsername,
        displayPfp
    );

    postDiv.append(postDetailsDiv, postBodyDiv, dividerDiv, footerDiv);

    const commentDiv = createElementWithClass('div', 'commentSection');
    commentDiv.style.display = 'none';

    const commentInputDiv = createElementWithClass('div', 'commentInputDiv');
    const commentTextBox = createElementWithClass('textarea', 'commentTextBox');
    const commentButton = createElementWithClass('button', 'commentButton');
    commentButton.textContent = 'Post Comment';

    commentButton.addEventListener('click', async () => {
        const commentContent = commentTextBox.value.trim();
        if (!commentContent) {
            alert('Comment cannot be empty.');
            return;
        }

        try {
            const response = await apiRequest('/api/createComment', 'POST', {
                accountNumber: fromAccountNumber,
                postId: post.postId,
                content: commentContent,
            });

            if (response.success) {
                alert('Comment posted successfully.');
                commentTextBox.value = '';

                const newComment = response.comment;

                renderComment(newComment, commentDiv, fromAccountNumber);
            } else {
                alert('Failed to post comment.');
            }
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('An error occurred while posting the comment.');
        }
    });

    commentInputDiv.appendChild(commentTextBox);
    commentInputDiv.appendChild(commentButton);
    commentDiv.appendChild(commentInputDiv);

    apiRequest('/api/getComments', 'POST', { postId: post.postId })
        .then((response) => {
            if (response.success) {
                response.comments.forEach(({ comment, username, pfp }) => {
                    renderComment({ ...comment, username, pfp }, commentDiv, fromAccountNumber);
                });
            } else {
                console.error('Failed to fetch comments:', response.message);
            }
        })
        .catch((error) => {
            console.error('Error fetching comments:', error);
        });

    postDiv.appendChild(commentDiv);

    footerDiv.append(dateE);

    const toggleCommentsButton = createElementWithClass('button', 'postButton postEditButton');
    toggleCommentsButton.textContent = 'Show Comments';

    toggleCommentsButton.addEventListener('click', () => {
        if (commentDiv.style.display === 'none' || !commentDiv.style.display) {
            commentDiv.style.display = 'block';
            toggleCommentsButton.textContent = 'Hide Comments';
        } else {
            commentDiv.style.display = 'none';
            toggleCommentsButton.textContent = 'Show Comments';
        }
    });

    footerDiv.appendChild(toggleCommentsButton);

    if (from == 'home') {
        homePanel.appendChild(postDiv);
    } else if (from == 'profile') {
        const profilePosts = document.getElementById('profilePosts');
        profilePosts.appendChild(postDiv);
    } else if (from == 'profilePosts') {
        const profileReposts = document.getElementById('profileReposts');
        profileReposts.appendChild(postDiv);
    }else if (from == 'search') {
        const profileReposts = document.getElementById('searchpanel');
        profileReposts.appendChild(postDiv);
    }
    if (from == 'home') {
        postImage.addEventListener("click", function (event) {
            window.location.href = `/profile/${post.accountNumber}`;  
        });
        postImage.classList.add("homeHover");
    }
    setupLikes(likeButton, likeCounter, post, fromAccountNumber);
    setupReposts(repostButton, repostCounter, post, fromAccountNumber);
}

function setPostAttributes(postDetailsDiv, postImage, usernameTitle, titleH1, postBodyDiv, contentP, dividerDiv, viewsH2, likeButton, likeCounter, repostButton, repostCounter, dateE, post, username, pfp) {
    postImage.src = pfp || post.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png';
    usernameTitle.textContent = `@${username || post.username || ''}`;
    titleH1.textContent = post.title || 'test';
    contentP.textContent = post.content || 'test';
    viewsH2.textContent = `${post.views || 0} Views`;
    likeCounter.textContent = `${post.likes?.length || 0} likes`;
    repostCounter.textContent = `${post.reposts?.length || 0} reposts`;
    likeButton.textContent = 'Like';
    likeButton.type = 'submit';
    repostButton.textContent = 'Repost';
    repostButton.type = 'submit';
    dateE.textContent = post.createdAt ? formatDate(post.createdAt) : '19:18 - April 20 2025';

    postDetailsDiv.append(postImage, usernameTitle, titleH1);
    dividerDiv.append(viewsH2, likeButton, likeCounter, repostButton, repostCounter);
    postBodyDiv.append(contentP, dividerDiv);
}

export function createElementWithClass(tag, className = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    return element;
}

function renderComment(comment, commentDiv, loggedInAccountNumber) {
    const commentElement = createElementWithClass('div', 'comment');
    const postDetailsDiv = createElementWithClass('div', 'postCommentDetails');
    const postImage = createElementWithClass('img', 'pfp');
    const usernameTitle = createElementWithClass('h1', 'usernameTitle');

    if (comment.accountNumber === loggedInAccountNumber) {
        const deleteButton = createElementWithClass('button', 'deleteButton');
        deleteButton.textContent = 'X';

        deleteButton.addEventListener('click', async () => {
            try {
                const response = await apiRequest('/api/deleteComment', 'POST', { commentId: comment.commentId });
                if (response.success) {
                    alert('Comment deleted successfully.');
                    commentElement.remove();
                } else {
                    alert('Failed to delete comment.');
                }
            } catch (error) {
                console.error('Error deleting comment:', error);
                alert('An error occurred while deleting the comment.');
            }
        });

        postDetailsDiv.append(deleteButton);
    }

    const postBodyDiv = createElementWithClass('div', 'postCommentBody');
    const contentP = createElementWithClass('p');
    const dateE = createElementWithClass('h2', 'date');
    const footerDiv = createElementWithClass('div', 'commentFooter');
    const spaceDiv = createElementWithClass('div', 'spaceDiv');

    postImage.src = comment.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png';
    usernameTitle.textContent = `@${comment.username || 'Anonymous'}`;
    contentP.textContent = comment.content || 'No content';
    dateE.textContent = comment.createdAt ? formatDate(comment.createdAt) : 'Unknown date';

    postDetailsDiv.append(postImage, usernameTitle);
    postBodyDiv.append(contentP);
    footerDiv.append(dateE);
    commentElement.append(postDetailsDiv, postBodyDiv, footerDiv, spaceDiv);

    commentDiv.appendChild(commentElement);
}

export function setupLikes(likeButton, likeCounter, post, accountNumber) {
    const postId = post.postId;

    apiRequest('/api/checkLike', 'POST', { postId, accountNumber })
        .then(data => {
            if (data.liked) {
                likeButton.textContent = 'Liked';
                likeButton.style.backgroundColor = "#777777";
            }
        })
        .catch(error => { console.error('Error checking like status:', error); });

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
                if (data && data.success) {
                    likeCounter.textContent = `${data.post.likes.length} likes`;
                }
            })
            .catch(error => { console.error('Error liking post or fetching updated data:', error); });
    });
}

export function setupReposts(repostButton, repostCounter, post, accountNumber) {
    const postId = post.postId;

    apiRequest('/api/checkRepost', 'POST', { postId, accountNumber })
        .then(data => {
            if (data.reposted) {
                repostButton.textContent = 'Reposted';
                repostButton.style.backgroundColor = "#777777";
            }
        })
        .catch(error => { console.error('Error checking repost status:', error); });

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
                    return apiRequest('/api/getPost', 'POST', { postId });
                }
            })
            .then(data => {
                if (data && data.success) {
                    repostCounter.textContent = `${data.post.reposts.length} reposts`;
                }
            })
            .catch(error => { console.error('Error reposting post or fetching updated data:', error); });
    });
}