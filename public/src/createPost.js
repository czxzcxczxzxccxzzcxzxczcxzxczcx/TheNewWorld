// createPost.js

export function createPost(post, pfp, username, homePanel) {
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

    // Add classes
    postDetailsDiv.classList.add('postDetails');
    postImage.classList.add('pfp');
    postBodyDiv.classList.add('postBody');
    dividerDiv.classList.add('divider');
    likeButton.classList.add('postButton');
    likeCounter.classList.add('likeCounter');
    repostButton.classList.add('postButton');
    repostCounter.classList.add('likeCounter');
    editButton.classList.add('postButton');
    postDiv.classList.add('post');
    usernameTitle.classList.add('usernameTitle');

    // Set content
    postImage.src = pfp;
    usernameTitle.textContent = `@${username}`;
    titleH1.textContent = `${post.title}`;
    contentP.textContent = post.content;
    viewsH2.textContent = `${post.views} Views`;
    likeCounter.textContent = `${post.likes.length} likes`;
    repostCounter.textContent = post.reposts;
    likeButton.textContent = 'Like';
    likeButton.type = 'submit';
    repostButton.type = 'submit';
    repostButton.textContent = 'Repost';
    editButton.type = 'submit';
    editButton.textContent = 'Edit Post';

    // Append elements
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

    // Append the post to the homePanel
    homePanel.appendChild(postDiv);
}
