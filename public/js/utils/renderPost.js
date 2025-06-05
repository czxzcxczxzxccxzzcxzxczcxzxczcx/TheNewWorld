import { apiRequest } from './apiRequest.js';
import { createElementWithClass } from './createElement.js';

function formatDate(dateString) {
    const date = new Date(dateString);

    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();

    return `${hours}:${minutes} - ${month} ${day} ${year}`;
}

export function changeEdit(edit, pfpDisplay, profileText, pfpText, bioBorder, userBorder) {
    bio.contentEditable = edit;
    changePfp.contentEditable = edit;
    profileUsername.contentEditable = edit;
    changePfp.style.display = pfpDisplay;
    profileEdit.textContent = profileText;
    changePfp.style.border = pfpText;
    bio.style.border = bioBorder;
    username.style.border = userBorder;
}

function makeMentionsClickable(content) {
    return content.replace(/@([a-zA-Z0-9_]+)/g, '<a href="/profile/$1">@$1</a>');
}

function processContent(content) {
    // Make mentions clickable
    let processedContent = makeMentionsClickable(content);

    // First, replace image URLs that are inside < > or &lt; &gt; with <img> tags
    processedContent = processedContent.replace(/<\s*(https?:\/\/[^>\s]+\.(?:png|jpg|jpeg|gif))\s*>/gi, '<img src="$1" alt="User Image" class="post-image-natural">');
    processedContent = processedContent.replace(/&lt;\s*(https?:\/\/[^&\s]+\.(?:png|jpg|jpeg|gif))\s*&gt;/gi, '<img src="$1" alt="User Image" class="post-image-natural">');

    // Then, make plain URLs clickable, but skip those already inside an <img> tag
    processedContent = processedContent.replace(/(https?:\/\/[^\s<>'"()\[\]{}]+)/gi, function(url) {
        // If this URL is already part of an <img ... src="url" ...>, skip linking
        if (processedContent.includes(`<img src=\"${url}\"`)) return url;
        // Don't double-link if already inside an <a>
        if (/^<a [^>]+>/.test(url)) return url;
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });

    return processedContent;
}

export function renderPost(post, username, pfp, accountNumber, from, fromAccountNumber) {
    const postDiv = createElementWithClass('div', 'post');
    const postDetailsDiv = createElementWithClass('div', 'postDetails');
    const postImage = createElementWithClass('img', 'pfp');
    const usernameTitle = createElementWithClass('h1', 'usernameTitle');
    const titleH1 = createElementWithClass('h1', 'postTitle');
    const postBodyDiv = createElementWithClass('div', 'postBody');
    const contentP = createElementWithClass('p');
    const dividerDiv = createElementWithClass('div', 'divider');
    const viewsH2 = createElementWithClass('h2','postViews');
    const likeButton = createElementWithClass('button', 'postButton likeButton');
    const likeCounter = createElementWithClass('h2', 'likeCounter');
    const repostButton = createElementWithClass('button', 'postButton');
    const repostCounter = createElementWithClass('h2', 'likeCounter');
    const dateE = createElementWithClass('h2', 'date');
    const footerDiv = createElementWithClass('div', 'footer');
    const buttonsDiv = createElementWithClass('div', 'buttonsDiv');
    const commentDiv = createElementWithClass('div', 'commentSection');
    const commentInputDiv = createElementWithClass('div', 'commentInputDiv');
    const commentTextBox = createElementWithClass('textarea', 'commentTextBox');
    const commentButton = createElementWithClass('button', 'commentButton');
    const toggleCommentsButton = createElementWithClass('button', 'postButton postEditButton');


    const displayUsername = username || post.username || 'Anonymous';
    const displayPfp = pfp || post.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png';

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


    setPostAttributes(postDiv,
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
        buttonsDiv,
        dateE,
        post,
        displayUsername,
        displayPfp
    );

    postDiv.append(postDetailsDiv, postBodyDiv,buttonsDiv, );
    footerDiv.append(dateE);

    commentDiv.style.display = 'none';
    commentButton.textContent = 'Post Comment';
    toggleCommentsButton.textContent = 'Comments';
    toggleCommentsButton.style.color = '#ffffff'

    commentInputDiv.appendChild(commentTextBox);
    commentInputDiv.appendChild(commentButton);
    commentDiv.appendChild(commentInputDiv);
    postDiv.appendChild(commentDiv);
    buttonsDiv.appendChild(toggleCommentsButton); 


    const processedContent = processContent(post.content || 'test');
    contentP.innerHTML = processedContent; // Use innerHTML to allow anchor tags and images
    // Process post content to make mentions clickable and render images
   
    // Add delete button if the post belongs to the logged-in user
    if (post.accountNumber === fromAccountNumber) {
        const deleteButton = createElementWithClass('button', 'deleteButton');
        deleteButton.textContent = 'X';

        deleteButton.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this post?')) {
                try {
                    const response = await apiRequest('/api/deletePost', 'POST', { postId: post.postId });
                    if (response.success) {
                        alert('Post deleted successfully.');
                        postDiv.remove();
                    } else {
                        alert('Failed to delete post.');
                    }
                } catch (error) {
                    console.error('Error deleting post:', error);
                    alert('An error occurred while deleting the post.');
                }
            }
        });
        postDetailsDiv.appendChild(deleteButton);
    }



    usernameTitle.addEventListener("click", function (event) 
        {window.location.href = `/profile/${post.accountNumber}`;  
    });

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

    toggleCommentsButton.addEventListener('click', () => {
        if (commentDiv.style.display === 'none' || !commentDiv.style.display) {
            commentDiv.style.display = 'block';
            toggleCommentsButton.style.color = '#007bff'
        } else {
            commentDiv.style.display = 'none';
            toggleCommentsButton.style.color = '#ffffff'
        }
    });

    // Add edit button if the post belongs to the logged-in user
    if (post.accountNumber === fromAccountNumber) {setupEditButton(buttonsDiv, post, titleH1, contentP); }

    if (from == 'home') {
        homePanel.appendChild(postDiv);
        postImage.addEventListener("click", function (event) { window.location.href = `/profile/${post.accountNumber}`;  });
        postImage.classList.add("homeHover");
    } else if (from == 'profile') {
        const profilePosts = document.getElementById('profilePosts');
        profilePosts.appendChild(postDiv);
        postImage.classList.add("homeHover");
    } else if (from == 'profilePosts') {
        const profileReposts = document.getElementById('profileReposts');
        profileReposts.appendChild(postDiv);
    }else if (from == 'search') {
        const profileReposts = document.getElementById('searchpanel');
        profileReposts.appendChild(postDiv);
    }

    setupLikes(likeButton, likeCounter, post, fromAccountNumber);
    setupReposts(repostButton, repostCounter, post, fromAccountNumber);
}

function setPostAttributes(postDiv,postDetailsDiv, postImage, usernameTitle, titleH1, postBodyDiv, contentP, dividerDiv, viewsH2, likeButton, likeCounter, repostButton, repostCounter,buttonsDiv, dateE, post, username, pfp) {
    postImage.src = pfp || post.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png';
    usernameTitle.textContent = `@${username || post.username || ''}`;
    // titleH1.textContent = post.title || 'test';
    contentP.textContent = post.content || 'test';
    viewsH2.textContent = `${post.views || 0} Views`;
    // likeCounter.textContent = `${post.likes?.length || 0} likes`;
    // repostCounter.textContent = `${post.reposts?.length || 0} reposts`;

    titleH1.textContent = post.createdAt ? formatDate(post.createdAt) : '19:18 - April 20 2025';

    // Update buttons to only show icons
    likeButton.textContent = `Likes (${post.likes?.length || 0})`;
    likeButton.type = 'submit';

    repostButton.textContent = `Reposts (${post.reposts?.length || 0})`;
    repostButton.type = 'submit';

    dateE.textContent = post.createdAt ? formatDate(post.createdAt) : '19:18 - April 20 2025';

    postDetailsDiv.append(postImage, usernameTitle, titleH1);
    // dividerDiv.append(viewsH2, likeCounter, repostCounter);
    postBodyDiv.append(contentP);
    // postBodyDiv.append(dividerDiv);
    buttonsDiv.append(likeButton, repostButton);
}

function renderComment(comment, commentDiv, loggedInAccountNumber) {
    const commentElement = createElementWithClass('div', 'comment');
    const postDetailsDiv = createElementWithClass('div', 'postCommentDetails');
    const postImage = createElementWithClass('img', 'pfp');
    const titleH1 = createElementWithClass('h1', 'postTitle');

    const usernameTitle = createElementWithClass('h1', 'usernameTitle');
    const postBodyDiv = createElementWithClass('div', 'postCommentBody');
    const contentP = createElementWithClass('p');
    const dateE = createElementWithClass('h2', 'date');
    const footerDiv = createElementWithClass('div', 'commentFooter');

    postImage.src = comment.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png';
    usernameTitle.textContent = `@${comment.username || 'Anonymous'}`;
    contentP.textContent = comment.content || 'No content';
    titleH1.textContent = comment.createdAt ? formatDate(comment.createdAt) : 'Unknown date';
    // titleH1.textContent = comment.title || 'No title';

    postDetailsDiv.append(postImage, usernameTitle,titleH1);
    postBodyDiv.append(contentP);
    // footerDiv.append(dateE);
    commentElement.append(postDetailsDiv, postBodyDiv);

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

    commentDiv.appendChild(commentElement);
}

export function setupLikes(likeButton, likeCounter, post, accountNumber) {
    const postId = post.postId;

    // Set initial state of the like button
    apiRequest('/api/checkLike', 'POST', { postId, accountNumber })
        .then(data => {
            if (data.liked) {
                likeButton.style.color = '#007bff'
            }
        })
        .catch(error => { console.error('Error checking like status:', error); });

    likeButton.addEventListener("click", () => {
        apiRequest('/api/likePost', 'POST', { postId, accountNumber })
            .then(data => {
                if (data.success) {
                    if (data.removed) {
                        likeButton.style.color = '#ffffff'
                    } else {
                        likeButton.style.color = '#007bff'
                    }
                    return apiRequest('/api/getPost', 'POST', { postId });
                }
            })
            .then(data => {
                if (data && data.success) {
                    likeButton.textContent = `L (${data.post.likes.length})`;
                }
            })
            .catch(error => { console.error('Error liking post or fetching updated data:', error); });
    });
}

export function setupReposts(repostButton, repostCounter, post, accountNumber) {
    const postId = post.postId;

    // Set initial state of the repost button
    repostButton.style.color = '#ffffff'

    apiRequest('/api/checkRepost', 'POST', { postId, accountNumber })
        .then(data => {
            if (data.reposted) {
                repostButton.style.color = '#007bff'
            }
        })
        .catch(error => { console.error('Error checking repost status:', error); });

    repostButton.addEventListener("click", () => {
        apiRequest('/api/repost', 'POST', { postId, accountNumber })
            .then(data => {
                if (data.success) {
                    if (data.removed) {
                        repostButton.style.color = '#ffffff'
                    } else {
                        repostButton.style.color = '#007bff'
                    }
                    return apiRequest('/api/getPost', 'POST', { postId });
                }
            })
            .then(data => {
                if (data && data.success) {
                    repostButton.textContent = `R (${data.post.reposts.length})`;
                }
            })
            .catch(error => { console.error('Error reposting post or fetching updated data:', error); });
    });
}

export async function updatePost(postId, title, content) {
    try {
        const data = await apiRequest('/api/changePostData', 'POST', { postId, title, content });
        if (data.success) {
            console.log('Post updated successfully');
            alert('Post updated successfully');
        } else {
            console.error('Failed to update post');
            alert('Failed to update post');
        }
    } catch (error) {
        alert(error);
    }
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
    editButton.textContent = 'Edit';
    editButton.setAttribute('data-id', post.postId);

    editButton.addEventListener('click', () => {
        const isEditable = contentElement.isContentEditable;

        if (isEditable) {
            changeProfileEdit(false, 'Edit', '', contentElement, titleElement, editButton);
            updatePost(post.postId, titleElement.textContent, contentElement.textContent);

            const processedContent = processContent(contentElement.textContent);
            contentElement.innerHTML = processedContent;
        } else {
            // When entering edit mode, convert images back to <url> format for editing
            let html = contentElement.innerHTML;
            html = html.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, function(match, p1) { return `&lt;${p1}&gt;`; });

            contentElement.innerHTML = html;
            changeProfileEdit(true, 'Save Post', '1px dashed #ccc', contentElement, titleElement, editButton);
        }
    });
    parent.appendChild(editButton);
}