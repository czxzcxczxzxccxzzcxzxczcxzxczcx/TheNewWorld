import { apiRequest } from './apiRequest.js';
import { createElementWithClass } from './createElement.js';

function showDeleteConfirmation(title, message, onConfirm) {
    // Create confirmation modal
    const modal = document.createElement('div');
    modal.className = 'delete-confirmation-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: var(--card-bg-solid, #1a1a1a);
        border: 1px solid var(--border-color, #333);
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        color: var(--text-primary, white);
    `;

    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    titleElement.style.cssText = `
        margin: 0 0 16px 0;
        font-size: 1.25rem;
        font-weight: 600;
    `;

    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messageElement.style.cssText = `
        margin: 0 0 24px 0;
        color: var(--text-secondary, #b3b3b3);
        line-height: 1.5;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 12px;
        justify-content: center;
    `;

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
        padding: 12px 24px;
        background: var(--secondary-bg, #2a2a2a);
        color: var(--text-primary, white);
        border: 1px solid var(--border-color, #333);
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
    `;

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.style.cssText = `
        padding: 12px 24px;
        background: var(--error-red, #f4212e);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
    `;

    // Add hover effects
    cancelButton.addEventListener('mouseenter', () => {
        cancelButton.style.background = 'var(--hover-bg, #3a3a3a)';
    });
    cancelButton.addEventListener('mouseleave', () => {
        cancelButton.style.background = 'var(--secondary-bg, #2a2a2a)';
    });

    deleteButton.addEventListener('mouseenter', () => {
        deleteButton.style.background = '#d31e2a';
    });
    deleteButton.addEventListener('mouseleave', () => {
        deleteButton.style.background = 'var(--error-red, #f4212e)';
    });

    // Event listeners
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    deleteButton.addEventListener('click', () => {
        document.body.removeChild(modal);
        onConfirm();
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });

    // Assemble modal
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(deleteButton);
    modalContent.appendChild(titleElement);
    modalContent.appendChild(messageElement);
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);

    // Add to page
    document.body.appendChild(modal);

    // Add fade-in animation
    modal.animate([
        { opacity: 0 },
        { opacity: 1 }
    ], {
        duration: 200,
        easing: 'ease-out'
    });
}

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

    // Use the same responsive class and style for all images, but left-align by default
    const imgClass = 'post-image-responsive';
    const imgStyle = 'max-width:250px; height:auto; border-radius: 8px; margin: 10px 0;';
    
    // More flexible image detection that works with CloudFront URLs and other image hosting
    // First handle <URL> syntax for any image URL (including those without extensions)
    processedContent = processedContent.replace(/<\s*(https?:\/\/[^>\s]+)\s*>/gi, function(match, url) {
        // Check for video URLs first
        if (url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)) {
            const videoMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
            if (videoMatch) {
                const videoId = videoMatch[1];
                return `<iframe width="350" height="200" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen style="margin:10px 0;"></iframe>`;
            }
        }
        
        // Check for MP4 videos
        if (url.match(/\.mp4(\?.*)?$/i)) {
            return `<video controls style="max-width:350px; height:auto; margin:10px 0;"><source src="${url}" type="video/mp4">Your browser does not support the video tag.</video>`;
        }
        
        // Check if it's likely an image URL (common image hosts or file extensions)
        if (url.match(/\.(png|jpg|jpeg|gif|webp|bmp|svg)(\?.*)?$/i) || 
            url.includes('cloudfront.net') || 
            url.includes('amazonaws.com') ||
            url.includes('post-images/')) {
            return `<img src="${url}" alt="User Image" class="${imgClass}" style="${imgStyle}">`;
        }
        
        // If not an image or video, treat as regular link
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
    
    // Handle HTML-encoded brackets
    processedContent = processedContent.replace(/&lt;\s*(https?:\/\/[^&\s]+)\s*&gt;/gi, function(match, url) {
        // Check for video URLs first
        if (url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)) {
            const videoMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
            if (videoMatch) {
                const videoId = videoMatch[1];
                return `<iframe width="350" height="200" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen style="margin:10px 0;"></iframe>`;
            }
        }
        
        // Check for MP4 videos
        if (url.match(/\.mp4(\?.*)?$/i)) {
            return `<video controls style="max-width:350px; height:auto; margin:10px 0;"><source src="${url}" type="video/mp4">Your browser does not support the video tag.</video>`;
        }
        
        if (url.match(/\.(png|jpg|jpeg|gif|webp|bmp|svg)(\?.*)?$/i) || 
            url.includes('cloudfront.net') || 
            url.includes('amazonaws.com') ||
            url.includes('post-images/')) {
            return `<img src="${url}" alt="User Image" class="${imgClass}" style="${imgStyle}">`;
        }
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });

    // Make remaining plain URLs clickable (but skip those already processed)
    processedContent = processedContent.replace(/(https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+)(?![^<]*>|[^<>]*<\/(?:a|img|iframe|video)>)/gi, function(url) {
        // If this URL is already part of an <img ... src="url" ...>, <iframe ... src="url" ...>, or <video ... src="url" ...>, skip linking
        if (processedContent.includes(`<img src="${url}"`) || processedContent.includes(`<iframe src="${url}"`) || processedContent.includes(`<source src="${url}"`)) return url;
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


    const processedContent = processContent(post.content || '');
    if (processedContent.trim()) {
        contentP.innerHTML = processedContent; // Use innerHTML to allow anchor tags and images
    } else {
        contentP.style.display = 'none'; // Hide empty content
    }
    
    // Render poll if it exists
    if (post.poll && post.poll.isEnabled) {
        const pollDiv = renderPoll(post.poll, post.postId, fromAccountNumber);
        postBodyDiv.appendChild(pollDiv);
    }
    
    // Note: imageUrl field is now handled within the content processing via <url> syntax
    // This prevents duplicate images from being displayed
    
    // Process post content to make mentions clickable and render images
   
    // Add delete button if the post belongs to the logged-in user
    if (post.accountNumber === fromAccountNumber) {
        const deleteButton = createElementWithClass('button', 'deleteButton');
        deleteButton.textContent = 'X';

        deleteButton.addEventListener('click', async () => {
            showDeleteConfirmation(
                'Delete Post',
                'Are you sure you want to delete this post? This action cannot be undone.',
                async () => {
                    try {
                        const response = await apiRequest('/api/deletePost', 'POST', { postId: post.postId });
                        if (response.success) {
                            // Add smooth removal animation
                            postDiv.style.transform = 'scale(0.95)';
                            postDiv.style.opacity = '0';
                            postDiv.style.transition = 'all 0.3s ease';
                            setTimeout(() => postDiv.remove(), 300);
                        } else {
                            alert('Failed to delete post.');
                        }
                    } catch (error) {
                        console.error('Error deleting post:', error);
                        alert('An error occurred while deleting the post.');
                    }
                }
            );
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
    } else if (from == 'search') {
        const profileReposts = document.getElementById('searchpanel');
        profileReposts.appendChild(postDiv);
    } else if (from == 'single') {
        const postContainer = document.getElementById('postContainer');
        if (postContainer) {
            postContainer.appendChild(postDiv);
        }
        postImage.addEventListener("click", function (event) { window.location.href = `/profile/${post.accountNumber}`;  });
        postImage.classList.add("homeHover");
    }

    setupLikes(likeButton, likeCounter, post, fromAccountNumber);
    setupReposts(repostButton, repostCounter, post, fromAccountNumber);
    
    // Add long-press functionality to open post in new tab (but not for single post view)
    if (from !== 'single') {
        setupLongPressToOpenPost(postDiv, post.postId);
    }
}

function setPostAttributes(postDiv,postDetailsDiv, postImage, usernameTitle, titleH1, postBodyDiv, contentP, dividerDiv, viewsH2, likeButton, likeCounter, repostButton, repostCounter,buttonsDiv, dateE, post, username, pfp) {
    postImage.src = pfp || post.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png';
    usernameTitle.textContent = `@${username || post.username || ''}`;
    // titleH1.textContent = post.title || 'test';
    // Note: contentP content is set via processContent() function in renderPost, don't override it here
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
    const buttonsDiv = createElementWithClass('div', 'commentButtons');

    postImage.src = comment.pfp || 'https://cdn.pfps.gg/pfps/9463-little-cat.png';
    usernameTitle.textContent = `@${comment.username || 'Anonymous'}`;
    contentP.textContent = comment.content || 'No content';
    titleH1.textContent = comment.createdAt ? formatDate(comment.createdAt) : 'Unknown date';

    // Create like and repost buttons
    const likeButton = createElementWithClass('button', 'postButton');
    const repostButton = createElementWithClass('button', 'postButton');
    
    const likesCount = comment.likes ? comment.likes.length : 0;
    const repostsCount = comment.reposts ? comment.reposts.length : 0;
    
    likeButton.textContent = `Likes (${likesCount})`;
    repostButton.textContent = `Reposts (${repostsCount})`;

    postDetailsDiv.append(postImage, usernameTitle, titleH1);
    postBodyDiv.append(contentP);
    buttonsDiv.append(likeButton, repostButton);

    // Add delete button if user owns the comment
    if (comment.accountNumber === loggedInAccountNumber) {
        const deleteButton = createElementWithClass('button', 'deleteButton');
        deleteButton.innerHTML = '×';
        deleteButton.setAttribute('title', 'Delete comment');

        deleteButton.addEventListener('click', async () => {
            showDeleteConfirmation(
                'Delete Comment',
                'Are you sure you want to delete this comment? This action cannot be undone.',
                async () => {
                    try {
                        const response = await apiRequest('/api/deleteComment', 'POST', { commentId: comment.commentId });
                        if (response.success) {
                            commentElement.style.transform = 'translateX(100%)';
                            commentElement.style.opacity = '0';
                            setTimeout(() => commentElement.remove(), 300);
                        } else {
                            alert('Failed to delete comment.');
                        }
                    } catch (error) {
                        console.error('Error deleting comment:', error);
                        alert('An error occurred while deleting the comment.');
                    }
                }
            );
        });

        commentElement.appendChild(deleteButton);
    }

    commentElement.append(postDetailsDiv, postBodyDiv, buttonsDiv);

    // Setup comment interaction handlers
    setupCommentLikes(likeButton, comment, loggedInAccountNumber);
    setupCommentReposts(repostButton, comment, loggedInAccountNumber);

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
                    likeButton.textContent = `Likes (${data.post.likes.length})`;
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
                    repostButton.textContent = `Reposts (${data.post.reposts.length})`;
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
            // Exiting edit mode - save changes and reprocess content
            changeProfileEdit(false, 'Edit', '', contentElement, titleElement, editButton);
            
            // Get the raw text content from the editable element
            const rawContent = contentElement.textContent || contentElement.innerText || '';
            
            updatePost(post.postId, titleElement.textContent, rawContent);

            // Process the content to convert <url> back to images and handle formatting
            const processedContent = processContent(rawContent);
            contentElement.innerHTML = processedContent;
        } else {
            // Entering edit mode - convert rendered content back to editable format
            let editableContent = '';
            
            // Start with the original post content if available
            if (post.content) {
                editableContent = post.content;
            } else {
                // If no original content, try to reverse-engineer from the HTML
                let html = contentElement.innerHTML;
                
                // Convert images back to <url> format for editing
                html = html.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, function(match, url) { 
                    return `<${url}>`;
                });
                
                // Remove line breaks that were converted to <br> tags
                html = html.replace(/<br\s*\/?>/gi, '\n');
                
                // Handle HTML entities
                html = html.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                
                editableContent = html;
            }
            
            // If the post had a separate imageUrl field (legacy posts), add it to content for editing
            if (post.imageUrl && !editableContent.includes(post.imageUrl)) {
                editableContent += (editableContent ? '\n' : '') + `<${post.imageUrl}>`;
            }
            
            // Set the editable content as plain text
            contentElement.textContent = editableContent;
            changeProfileEdit(true, 'Save Post', '1px dashed #ccc', contentElement, titleElement, editButton);
        }
    });
    parent.appendChild(editButton);
}

function setupCommentLikes(likeButton, comment, accountNumber) {
    const commentId = comment.commentId;

    // Set initial state of the like button
    apiRequest('/api/checkCommentLike', 'POST', { commentId, accountNumber })
        .then(data => {
            if (data.liked) {
                likeButton.style.color = '#007bff';
            }
        })
        .catch(error => { console.error('Error checking comment like status:', error); });

    likeButton.addEventListener("click", () => {
        apiRequest('/api/likeComment', 'POST', { commentId, accountNumber })
            .then(data => {
                if (data.success) {
                    if (data.removed) {
                        likeButton.style.color = '#ffffff';
                    } else {
                        likeButton.style.color = '#007bff';
                    }
                    // Update the like count by refetching comment data
                    return apiRequest('/api/getComments', 'POST', { postId: comment.postId });
                }
            })
            .then(data => {
                if (data && data.success) {
                    const updatedComment = data.comments.find(c => c.comment.commentId === commentId);
                    if (updatedComment) {
                        const likesCount = updatedComment.comment.likes ? updatedComment.comment.likes.length : 0;
                        likeButton.textContent = `Likes (${likesCount})`;
                    }
                }
            })
            .catch(error => {
                console.error('Error liking comment:', error);
            });
    });
}

function setupCommentReposts(repostButton, comment, accountNumber) {
    const commentId = comment.commentId;

    // Set initial state of the repost button
    apiRequest('/api/checkCommentRepost', 'POST', { commentId, accountNumber })
        .then(data => {
            if (data.reposted) {
                repostButton.style.color = '#28a745';
            }
        })
        .catch(error => { console.error('Error checking comment repost status:', error); });

    repostButton.addEventListener("click", () => {
        apiRequest('/api/repostComment', 'POST', { commentId, accountNumber })
            .then(data => {
                if (data.success) {
                    if (data.removed) {
                        repostButton.style.color = '#ffffff';
                    } else {
                        repostButton.style.color = '#28a745';
                    }
                    // Update the repost count by refetching comment data
                    return apiRequest('/api/getComments', 'POST', { postId: comment.postId });
                }
            })
            .then(data => {
                if (data && data.success) {
                    const updatedComment = data.comments.find(c => c.comment.commentId === commentId);
                    if (updatedComment) {
                        const repostsCount = updatedComment.comment.reposts ? updatedComment.comment.reposts.length : 0;
                        repostButton.textContent = `Reposts (${repostsCount})`;
                    }
                }
            })
            .catch(error => {
                console.error('Error reposting comment:', error);
            });
    });
}

function setupLongPressToOpenPost(postElement, postId) {
    let longPressTimer;
    let isLongPress = false;

    postElement.addEventListener('mousedown', function(e) {
        // Only trigger on left mouse button
        if (e.button !== 0) return;
        
        isLongPress = false;
        longPressTimer = setTimeout(() => {
            isLongPress = true;
            // Open post in new tab
            window.open(`/post/${postId}`, '_blank');
        }, 800); // 800ms for long press
    });

    postElement.addEventListener('mouseup', function(e) {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
        }
    });

    postElement.addEventListener('mouseleave', function(e) {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
        }
    });

    // Prevent default context menu on long press
    postElement.addEventListener('contextmenu', function(e) {
        if (isLongPress) {
            e.preventDefault();
        }
    });

    // Add touch support for mobile devices
    postElement.addEventListener('touchstart', function(e) {
        isLongPress = false;
        longPressTimer = setTimeout(() => {
            isLongPress = true;
            // Open post in new tab
            window.open(`/post/${postId}`, '_blank');
        }, 800);
    });

    postElement.addEventListener('touchend', function(e) {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
        }
    });

    postElement.addEventListener('touchmove', function(e) {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
        }
    });
}

// Function to render a poll
function renderPoll(poll, postId, userAccountNumber) {
    const pollDiv = createElementWithClass('div', 'poll-container');
    pollDiv.style.cssText = `
        margin: 15px 0;
        padding: 15px;
        border: 1px solid var(--border-color, #333);
        border-radius: 8px;
        background: var(--card-bg, rgba(255,255,255,0.05));
    `;

    // Poll question
    if (poll.question && poll.question.trim()) {
        const questionDiv = createElementWithClass('div', 'poll-question');
        questionDiv.textContent = poll.question;
        questionDiv.style.cssText = `
            font-weight: bold;
            margin-bottom: 10px;
            color: var(--text-primary, #fff);
            font-size: 16px;
        `;
        pollDiv.appendChild(questionDiv);
    }

    // Check if poll has ended
    const hasEnded = poll.endsAt && new Date() > new Date(poll.endsAt);
    
    // Poll options
    const optionsDiv = createElementWithClass('div', 'poll-options');
    poll.options.forEach((option, index) => {
        const optionDiv = createElementWithClass('div', 'poll-option');
        const percentage = poll.totalVotes > 0 ? Math.round((option.votes.length / poll.totalVotes) * 100) : 0;
        const hasVoted = option.votes.includes(userAccountNumber);
        const hasVotedAnywhere = poll.options.some(opt => opt.votes.includes(userAccountNumber));

        optionDiv.style.cssText = `
            margin: 8px 0;
            padding: 12px;
            border: 1px solid ${hasVoted ? '#007bff' : 'var(--border-color, #333)'};
            border-radius: 6px;
            cursor: ${hasEnded ? 'default' : 'pointer'};
            position: relative;
            background: var(--secondary-bg, #1a1a1a);
            transition: all 0.2s ease;
            overflow: hidden;
        `;

        // Progress bar background
        const progressBar = createElementWithClass('div', 'poll-progress');
        progressBar.style.cssText = `
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: ${percentage}%;
            background: ${hasVoted ? '#007bff' : '#333'};
            opacity: 0.3;
            transition: width 0.3s ease;
            z-index: 1;
        `;
        optionDiv.appendChild(progressBar);

        // Option content
        const contentDiv = createElementWithClass('div', 'poll-option-content');
        contentDiv.style.cssText = `
            position: relative;
            z-index: 2;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const textSpan = createElementWithClass('span', 'poll-option-text');
        textSpan.textContent = option.text;
        textSpan.style.color = 'var(--text-primary, #fff)';

        const statsSpan = createElementWithClass('span', 'poll-option-stats');
        statsSpan.textContent = `${percentage}% (${option.votes.length})`;
        statsSpan.style.cssText = `
            font-size: 12px;
            color: var(--text-secondary, #888);
            font-weight: bold;
        `;

        contentDiv.appendChild(textSpan);
        contentDiv.appendChild(statsSpan);
        optionDiv.appendChild(contentDiv);

        // Add voting functionality
        if (!hasEnded) {
            optionDiv.addEventListener('click', async () => {
                try {
                    const response = await apiRequest('/api/votePoll', 'POST', {
                        postId: postId,
                        optionIndex: index
                    });

                    if (response.success) {
                        // Update the poll display with new data
                        const newPollDiv = renderPoll(response.poll, postId, userAccountNumber);
                        pollDiv.replaceWith(newPollDiv);
                    } else {
                        alert(response.message || 'Failed to vote');
                    }
                } catch (error) {
                    console.error('Error voting on poll:', error);
                    alert('Error voting on poll');
                }
            });

            optionDiv.addEventListener('mouseenter', () => {
                if (!hasVoted) {
                    optionDiv.style.borderColor = '#007bff';
                    optionDiv.style.background = 'var(--hover-bg, #2a2a2a)';
                }
            });

            optionDiv.addEventListener('mouseleave', () => {
                if (!hasVoted) {
                    optionDiv.style.borderColor = 'var(--border-color, #333)';
                    optionDiv.style.background = 'var(--secondary-bg, #1a1a1a)';
                }
            });
        }

        optionsDiv.appendChild(optionDiv);
    });

    pollDiv.appendChild(optionsDiv);

    // Poll footer with stats and end time
    const footerDiv = createElementWithClass('div', 'poll-footer');
    footerDiv.style.cssText = `
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid var(--border-color, #333);
        font-size: 12px;
        color: var(--text-secondary, #888);
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;

    const statsText = createElementWithClass('span');
    const voteText = poll.totalVotes === 1 ? 'vote' : 'votes';
    const multiVoteText = poll.allowMultipleVotes ? ' • Multiple votes allowed' : '';
    statsText.textContent = `${poll.totalVotes} ${voteText}${multiVoteText}`;

    const endTimeText = createElementWithClass('span');
    if (hasEnded) {
        endTimeText.textContent = 'Poll ended';
        endTimeText.style.color = '#dc3545';
    } else if (poll.endsAt) {
        const timeLeft = new Date(poll.endsAt) - new Date();
        const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
        endTimeText.textContent = `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
    }

    footerDiv.appendChild(statsText);
    if (endTimeText.textContent) {
        footerDiv.appendChild(endTimeText);
    }
    pollDiv.appendChild(footerDiv);

    return pollDiv;
}