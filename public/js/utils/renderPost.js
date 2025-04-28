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

export function changeFollow(text) {
    followbutton.contentEditable = edit;
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

function setPostAttributes(postDetailsDiv, postImage, usernameTitle, titleH1, postBodyDiv, contentP, dividerDiv, viewsH2, likeButton, likeCounter, repostButton, repostCounter, dateE, post, username, pfp) {
    postImage.src = pfp || post.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png'; // Use provided pfp, fallback to post.pfp, then placeholder
    usernameTitle.textContent = `@${username || post.username || ''}`; // Use provided username, fallback to post.username
    titleH1.textContent = post.title || 'test';
    contentP.textContent = post.content || 'test';
    viewsH2.textContent = `${post.views || 0} Views`; // Default to 0 views if not provided
    likeCounter.textContent = `${post.likes?.length || 0} likes`; // Default to 0 likes if none
    repostCounter.textContent = `${post.reposts?.length || 0} reposts`; // Default to 0 reposts if none
    likeButton.textContent = 'Like';
    likeButton.type = 'submit';
    repostButton.textContent = 'Repost';
    repostButton.type = 'submit';
    dateE.textContent = post.createdAt ? formatDate(post.createdAt) : '19:18 - April 20 2025';

    postDetailsDiv.append(postImage, usernameTitle, titleH1);
    dividerDiv.append(viewsH2, likeButton, likeCounter, repostButton, repostCounter);
    postBodyDiv.append(contentP, dividerDiv);
}

function renderComment(comment, commentDiv, loggedInAccountNumber) {
    const commentElement = createElementWithClass('div', 'comment');
    const postDetailsDiv = createElementWithClass('div', 'postCommentDetails');
    const postImage = createElementWithClass('img', 'pfp');
    const usernameTitle = createElementWithClass('h1', 'usernameTitle');

    // Add delete button only if the comment belongs to the logged-in user
    if (comment.accountNumber === loggedInAccountNumber) {
        const deleteButton = createElementWithClass('button', 'deleteButton');
        deleteButton.textContent = 'X';

        deleteButton.addEventListener('click', async () => {
            try {
                const response = await apiRequest('/api/deleteComment', 'POST', { commentId: comment.commentId });
                if (response.success) {
                    alert('Comment deleted successfully.');
                    commentElement.remove(); // Remove the comment from the DOM
                } else {
                    alert('Failed to delete comment.');
                }
            } catch (error) {
                console.error('Error deleting comment:', error);
                alert('An error occurred while deleting the comment.');
            }
        });

        postDetailsDiv.append(deleteButton); // Append delete button
    }

    const postBodyDiv = createElementWithClass('div', 'postCommentBody');
    const contentP = createElementWithClass('p');
    const dateE = createElementWithClass('h2', 'date');
    const footerDiv = createElementWithClass('div', 'commentFooter');
    const spaceDiv = createElementWithClass('div', 'spaceDiv');

    // Set attributes and content
    postImage.src = comment.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png'; // Placeholder image
    usernameTitle.textContent = `@${comment.username || 'Anonymous'}`;
    contentP.textContent = comment.content || 'No content';
    dateE.textContent = comment.createdAt ? formatDate(comment.createdAt) : 'Unknown date';

    postDetailsDiv.append(postImage, usernameTitle);
    postBodyDiv.append(contentP);
    footerDiv.append(dateE);
    commentElement.append(postDetailsDiv, postBodyDiv, footerDiv, spaceDiv);

    commentDiv.appendChild(commentElement);
}

export function renderPost(post, username, pfp, accountNumber, from, fromAccountNumber) {
    const postDiv = createElementWithClass('div', 'post');
    const postDetailsDiv = createElementWithClass('div', 'postDetails');
    const postImage = createElementWithClass('img', 'pfp');
    const usernameTitle = createElementWithClass('h1', 'usernameTitle');

    // Add delete button only if the post belongs to the logged-in user
    if (post.accountNumber === fromAccountNumber) {
        const deleteButton = createElementWithClass('button', 'deleteButton');
        deleteButton.textContent = 'X';

        deleteButton.addEventListener('click', async () => {
            try {
                const response = await apiRequest('/api/deletePost', 'POST', { postId: post.postId });
                if (response.success) {
                    alert('Post deleted successfully.');
                    postDiv.remove(); // Remove the post from the DOM

                    // Update the number of posts displayed on the profile page
                    if (from === 'profile') {
                        const postCountElement = document.getElementById('posts');
                        if (postCountElement) {
                            const currentCount = parseInt(postCountElement.textContent, 10) || 0;
                            postCountElement.textContent = `${Math.max(0, currentCount - 1)} Posts`; // Ensure count doesn't go below 0
                        }
                    }
                } else {
                    alert('Failed to delete post.');
                }
            } catch (error) {
                console.error('Error deleting post:', error);
                alert('An error occurred while deleting the post.');
            }
        });

        postDetailsDiv.append(deleteButton); // Append delete button
    }

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

    // Use the logged-in user's data if available
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
    commentDiv.style.display = 'none'; // Initially hide the comment section

    const commentInputDiv = createElementWithClass('div', 'commentInputDiv');
    const commentTextBox = createElementWithClass('textarea', 'commentTextBox');
    const commentButton = createElementWithClass('button', 'commentButton');
    commentButton.textContent = 'Post Comment';

    // Add event listener to handle comment creation
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
                commentTextBox.value = ''; // Clear the text box

                // Use the response data for the new comment
                const newComment = response.comment;

                renderComment(newComment, commentDiv, fromAccountNumber); // Render the new comment
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

    const spaceDivAboveComments = createElementWithClass('div', 'spaceDiv');
    spaceDivAboveComments.style.display = 'none'; // Initially hide the space div
    commentDiv.appendChild(spaceDivAboveComments);

    // Fetch and display comments
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

    // Ensure only one "Show Comments" button is added
    const toggleCommentsButton = createElementWithClass('button', 'postButton postEditButton');
    const toggleCommentsButton2 = createElementWithClass('button', 'postButton postEditButton');

    const toggleCommentsButton3 = createElementWithClass('button', 'postButton postEditButton');

    toggleCommentsButton.textContent = 'Show Comments';

    toggleCommentsButton.addEventListener('click', () => {
        if (commentDiv.style.display === 'none' || !commentDiv.style.display) {
            commentDiv.style.display = 'block';
            spaceDivAboveComments.style.display = 'block'; // Show the space div
            toggleCommentsButton.textContent = 'Hide Comments';
        } else {
            commentDiv.style.display = 'none';
            spaceDivAboveComments.style.display = 'none'; // Hide the space div
            toggleCommentsButton.textContent = 'Show Comments';
        }
    });

    footerDiv.appendChild(toggleCommentsButton,toggleCommentsButton2,toggleCommentsButton3);

    if (post.accountNumber === fromAccountNumber) { 
        setupEditButton(footerDiv, post, titleH1, contentP); 
    }

    if (from == 'home') { 
        homePanel.appendChild(postDiv);
    } else if (from == 'profile') {
        const profilePosts = document.getElementById('profilePosts');
        profilePosts.appendChild(postDiv);

        // Update the number of posts displayed on the profile page
        const postCountElement = document.getElementById('postCount');
        if (postCountElement) {
            const currentCount = parseInt(postCountElement.textContent, 10) || 0;
            postCountElement.textContent = currentCount + 1;
        }
    } else if (from == 'profilePosts') {
        const profileReposts = document.getElementById('profileReposts');
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
                    repostCounter.textContent = `${data.post.reposts.length} reposts`; 
                }
            })
            .catch(error => { console.error('Error reposting post or fetching updated data:', error); });
    });
}