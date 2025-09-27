import { apiRequest } from './utils/apiRequest.js';
import { renderPost, changeEdit } from './utils/renderPost.js';
import { initializeCreatePost } from './utils/createPostHandler.js';
import { renderBar } from './utils/renderBar.js';
import { initializeAuth } from './utils/auth.js';

renderBar();

document.addEventListener("DOMContentLoaded", async function () {
    let profileAccountNumber = window.location.pathname.split('/')[2];
    const gebid = id => document.getElementById(id);
    let userAccountNumber;
    let profileVerified = false;

    function updateProfileBadge(isVerified) {
        const usernameEl = gebid('profileUsername');
        if (!usernameEl) return;

        if (!isVerified) {
            const existingBadge = document.getElementById('profileUsernameBadge');
            if (existingBadge) {
                existingBadge.remove();
            }
            return;
        }

        // Ensure base text content reflects current username only
        const currentUsername = usernameEl.textContent.trim();
        usernameEl.textContent = currentUsername;

        let badge = document.getElementById('profileUsernameBadge');
        if (!badge) {
            badge = document.createElement('span');
            badge.id = 'profileUsernameBadge';
            badge.className = 'verified-badge';
            badge.textContent = '✓';
            badge.title = 'Verified account';
            badge.setAttribute('aria-label', 'Verified account');
        }

        usernameEl.appendChild(document.createTextNode(' '));
        usernameEl.appendChild(badge);
    }

    // Setup page with current user info
    async function setupPageWithAuth() {
        try {
            const user = await initializeAuth();
            userAccountNumber = user.accountNumber;
            initializeCreatePost(user.accountNumber);
            setupPage();
        } catch (error) {
            console.error("Error setting up page:", error);
        }
    }

   async function setupPage() {
        // Admin verification is now handled globally in renderBar.js

        apiRequest(`/api/get/profile/${profileAccountNumber}`, 'GET')
            .then(async data => {
                const username = data.username;
                const accountNumber = profileAccountNumber;
                const pfp = data.pfp;
                profileVerified = !!data.verified;

                if (parseInt(userAccountNumber) === parseInt(accountNumber)) {
                    gebid('profileEdit').style.display = "block";
                    gebid('followButton').style.display = "none";
                } else {
                    gebid('profileEdit').style.display = "none"; // Explicitly hide edit button
                    gebid('followButton').style.display = "block";

                    // Check if the profile is followed
                    try {
                        const followStatus = await apiRequest(`/api/isFollowed/${profileAccountNumber}`, 'GET');
                        if (followStatus.success && followStatus.isFollowing) {
                            gebid('followButton').textContent = 'Followed';
                            gebid('followButton').style.backgroundColor = "#777777";
                        }
                    } catch (error) {
                        console.error('Error checking follow status:', error);
                    }
                }

                apiRequest('/api/getUserPosts', 'POST', { accountNumber })
                    .then(data => {
                        if (data.success) {

                            // Update the number of posts displayed on the profile page
                            const postCountElement = gebid('posts');
                            if (postCountElement) {
                                postCountElement.textContent = `${data.posts.length} Posts`; // Set the total post count
                            }
                            // Sort posts by 'createdAt' in descending order
                            data.posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                            data.posts.forEach(post => {
                                renderPost(post, username, pfp, data.verified, 'profile', userAccountNumber);
                            });
                        }
                    });

                apiRequest('/api/getUserReposts', 'POST', { accountNumber })
                    .then(data => {
                        if (data && Array.isArray(data)) {
                            // Sort posts by 'createdAt' in descending order
                            data.sort((a, b) => new Date(b.post.createdAt) - new Date(a.post.createdAt));

                            data.forEach(item => {
                                const { post, username, pfp } = item;
                                renderPost(post, username, pfp, item.verified, 'profilePosts', userAccountNumber);
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching reposts:', error);
                    });

                const profileUsernameEl = gebid('profileUsername');
                profileUsernameEl.textContent = `${data.username}`;
                updateProfileBadge(profileVerified);
                gebid('pfp').src = pfp;
                gebid('accountnumber').textContent = ` (${data.accountNumber})`;
                gebid('bio').textContent = `${data.bio}`;
                gebid('following').textContent = `${Array.isArray(data.following) ? data.following.length : 0} Following`; // Ensure array
                gebid('followers').textContent = `${Array.isArray(data.followers) ? data.followers.length : 0} Followers`; // Ensure array
                gebid('changePfp').textContent = `${data.pfp}`;
                
                // Hide the pfp URL initially
                gebid('changePfp').style.display = 'none';
            })
            .catch(error => console.error('Error fetching profile data:', error));
    }

    function setProfileSectionStyles(postsDisplay, repostsDisplay, postsBtnColor, repostsBtnColor) {
        gebid("profilePosts").style.display = postsDisplay;
        gebid("profileReposts").style.display = repostsDisplay;
        gebid("postsButton").style.color = postsBtnColor;
        gebid("repostsButton").style.color = repostsBtnColor;
    }

    function updateFollowButtonAndCount(isFollowed, followersCount) {
        const followButton = gebid('followButton');
        if (isFollowed) {
            followButton.textContent = 'Followed';
            followButton.style.backgroundColor = '#777777';
            gebid('followers').textContent = ` ${followersCount + 1} Followers`;
        } else {
            followButton.textContent = 'Follow';
            followButton.style.backgroundColor = '';
            gebid('followers').textContent = ` ${followersCount - 1} Followers`;
        }
    }

    if (isNaN(profileAccountNumber)) { // If it's not a number, assume it's a username
        try {
            const response = await apiRequest('/api/getAccountNumber', 'POST', { username: profileAccountNumber });
            if (response.success) {
                profileAccountNumber = response.accountNumber; // Update to the fetched account number
            } else {
                console.error('Failed to fetch account number:', response.message);
                window.location.href = '/'; // Redirect to home if the username is invalid
            }
        } catch (error) {
            console.error('Error fetching account number:', error);
            window.location.href = '/'; // Redirect to home on error
        }
    }

    if (parseInt(userAccountNumber) !== parseInt(profileAccountNumber)) {
        const openDMButton = document.createElement('button');
        openDMButton.className = 'profileButton';
        openDMButton.id = 'openDMButton';
        openDMButton.textContent = 'Open DM';

        // Append the button next to the reposts button
        const repostsButton = gebid('repostsButton');
        if (repostsButton) {
            repostsButton.parentNode.insertBefore(openDMButton, repostsButton.nextSibling);
        }

        // Add event listener for the Open DM button
        openDMButton.addEventListener('click', async function () {
            try {
                const data = await apiRequest('/api/addOpenDM', 'POST', { recipientAccountNumber: profileAccountNumber });

                if (data.success) {
                    // alert('Direct message opened successfully.');
                    window.location.href = `/dm/${profileAccountNumber}`; // Redirect to the DM page
                } else {
                    alert(data.message || 'Failed to open direct message. Please try again.');
                }
            } catch (error) {
                console.error('Error opening direct message:', error);
                alert('Something went wrong. Please try again later.');
            }
        });
    }

    gebid('profileEdit').addEventListener("click", async function (event) {
        event.preventDefault();
        
        // Security check: Only allow editing own profile
        if (parseInt(userAccountNumber) !== parseInt(profileAccountNumber)) {
            alert('You can only edit your own profile!');
            return;
        }
        
        const pfp = gebid("changePfp").textContent;
    const profileUsernameEl = gebid("profileUsername");
    const username = profileUsernameEl.textContent.trim();
        const bio = gebid("bio").textContent.trim(); // Trim unnecessary whitespace
        const isEditable = gebid("bio").isContentEditable;

        if (isEditable) {
            changeEdit(false, "none", "Edit Profile", "", "", "");
            gebid("pfp").style.cursor = 'default';
            try {
                await apiRequest('/api/updateSettings', 'POST', { bio, pfp, username });
                updateProfileBadge(profileVerified);
            } catch (error) {
                console.error('Error updating profile settings:', error);
            }
        } else {
            const existingBadge = document.getElementById('profileUsernameBadge');
            if (existingBadge) {
                existingBadge.remove();
            }
            profileUsernameEl.textContent = profileUsernameEl.textContent.trim();
            changeEdit(true, "block", "Save Profile", '1px dashed #ccc', '1px dashed #ccc', '1px dashed #ccc');
            gebid("pfp").style.cursor = 'pointer';
        }
    });

    gebid('followButton').addEventListener("click", async function (event) {
        event.preventDefault();
        try {
            const followButton = gebid('followButton');
            const isCurrentlyFollowed = followButton.textContent === 'Followed';

            const data = await apiRequest('/api/follow', 'POST', { recipientAccountNumber: profileAccountNumber });

            if (data.success) {
                const followersText = gebid('followers').textContent.trim();
                const followersCount = parseInt(followersText.split(' ')[0]) || 0;
                updateFollowButtonAndCount(!isCurrentlyFollowed, followersCount);
            } else {
                alert(data.message || 'Failed to update follow status. Please try again.');
            }
        } catch (error) {
            console.error('Error updating follow status:', error);
            alert('Something went wrong. Please try again later.');
        }
    });

    gebid("followingLink").addEventListener("click", function (event) {
        event.preventDefault();
        if (profileAccountNumber) {window.location.href = `/following/${profileAccountNumber}`;}
    });
    
    gebid("followerLink").addEventListener("click", function (event) {
        event.preventDefault();
        if (profileAccountNumber) {window.location.href = `/followers/${profileAccountNumber}`;}
    });

    gebid("profileButton").addEventListener("click", function (event) {
        event.preventDefault();
        if (userAccountNumber) {window.location.href = `/profile/${userAccountNumber}`;}
    });

    gebid("repostsButton").addEventListener("click", function () {
        setProfileSectionStyles("none", "flex", "#ffffff", "#007bff");
    });

    gebid("postsButton").addEventListener("click", function () {
        setProfileSectionStyles("flex", "none", "#007bff", "#ffffff");
    });

    // Add PFP upload functionality
    const pfpImg = gebid('pfp');
    if (pfpImg) {
        // Create a hidden file input for PFP upload
        let pfpFileInput = document.createElement('input');
        pfpFileInput.type = 'file';
        pfpFileInput.accept = 'image/*';
        pfpFileInput.style.display = 'none';
        document.body.appendChild(pfpFileInput);

        // Variables for hold-click detection
        let holdTimer = null;
        let isHolding = false;
        
        // Mouse events for hold-click detection
        pfpImg.addEventListener('mousedown', function (e) {
            holdTimer = setTimeout(() => {
                isHolding = true;
                // Show the pfp URL on hold
                const changePfpElement = gebid('changePfp');
                changePfpElement.style.display = 'block';
                changePfpElement.style.opacity = '1';
            }, 500); // 500ms hold time
        });
        
        pfpImg.addEventListener('mouseup', function (e) {
            if (holdTimer) {
                clearTimeout(holdTimer);
            }
            
            if (!isHolding) {
                // Regular click behavior - check if editable for file upload
                const isEditable = gebid("bio").isContentEditable;
                if (isEditable && parseInt(userAccountNumber) === parseInt(profileAccountNumber)) {
                    pfpFileInput.value = '';
                    pfpFileInput.click();
                }
            }
            
            isHolding = false;
        });
        
        pfpImg.addEventListener('mouseleave', function (e) {
            if (holdTimer) {
                clearTimeout(holdTimer);
            }
            isHolding = false;
            // Hide the pfp URL when mouse leaves
            gebid('changePfp').style.display = 'none';
        });
        
        // Touch events for mobile hold-click detection
        pfpImg.addEventListener('touchstart', function (e) {
            holdTimer = setTimeout(() => {
                isHolding = true;
                // Show the pfp URL on hold
                const changePfpElement = gebid('changePfp');
                changePfpElement.style.display = 'block';
                changePfpElement.style.opacity = '1';
            }, 500); // 500ms hold time
        });
        
        pfpImg.addEventListener('touchend', function (e) {
            if (holdTimer) {
                clearTimeout(holdTimer);
            }
            
            if (!isHolding) {
                // Regular tap behavior - check if editable for file upload
                const isEditable = gebid("bio").isContentEditable;
                if (isEditable && parseInt(userAccountNumber) === parseInt(profileAccountNumber)) {
                    pfpFileInput.value = '';
                    pfpFileInput.click();
                }
            }
            
            isHolding = false;
            // Hide the pfp URL after touch ends
            setTimeout(() => {
                gebid('changePfp').style.display = 'none';
            }, 1000); 
        });

        pfpFileInput.addEventListener('change', async function () {
            if (!pfpFileInput.files.length) return;
            const file = pfpFileInput.files[0];
            const formData = new FormData();
            formData.append('image', file);
            try {
                // Upload to CDN
                const data = await apiRequest('/api/uploadPostImage', 'POST', formData, true);
                if (data.success && data.imageUrl) {
                    // Update settings with new PFP URL
                    const username = gebid('profileUsername').textContent;
                    const bio = gebid('bio').textContent.trim();
                    await apiRequest('/api/updateSettings', 'POST', { pfp: data.imageUrl, username, bio });
                    // Update the text content of changePfp
                    gebid('changePfp').textContent = data.imageUrl;
                    // Optionally update the profile image src immediately
                    pfpImg.src = data.imageUrl;
                } else {
                    alert(data.message || 'Failed to upload image.');
                }
            } catch (err) {
                alert('Failed to upload image.');
            }
        });
    }

    setupPageWithAuth();
});