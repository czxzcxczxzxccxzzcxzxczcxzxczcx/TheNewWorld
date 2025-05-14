import { apiRequest } from './utils/apiRequest.js';
import { renderPost, changeEdit } from './utils/renderPost.js';
import { initializeCreatePost } from './utils/createPostHandler.js';
import { renderBar, initializeGlobalButtons } from './utils/renderBar.js';

renderBar();

document.addEventListener("DOMContentLoaded", async function () {
    let profileAccountNumber = window.location.pathname.split('/')[2];
    var gebid = document.getElementById.bind(document);
    let userAccountNumber;

    // Check if profileAccountNumber is a username and fetch the account number if needed
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

    // Fetch user info and then set up the page
    async function fetchUserInfoAndSetupPage() {
        try {
            const data = await apiRequest('/api/getUserInfo', 'GET');
            if (data.success) {
                const user = data.user;
                userAccountNumber = user.accountNumber; // Set userAccountNumber
                console.log("User Account Number:", userAccountNumber);

                // Call setupPage only after userAccountNumber is set
                setupPage();
            } else {
                window.location.href = '/';
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
        }
    }

   async function setupPage() {
        apiRequest('/api/verify', 'GET')
            .then(data => {
                if (data.success) {
                    const adminButton = document.getElementById('adminPanelButton');
                    if (adminButton) {
                        adminButton.style.display = 'block'; // Set display to block if authorized
                    }
                }
            })
            .catch(error => {
                console.error('Error verifying admin access:', error);
            });

        apiRequest(`/api/get/profile/${profileAccountNumber}`, 'GET')
            .then(async data => {
                const username = data.username;
                const accountNumber = profileAccountNumber;
                const pfp = data.pfp;

                if (userAccountNumber === accountNumber) {
                    gebid('profileEdit').style.display = "block";
                    gebid('followButton').style.display = "none";
                } else {
                    console.log("Not profile", "uAN", userAccountNumber, "pAN", profileAccountNumber);
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
                                renderPost(post, username, pfp, accountNumber, 'profile', userAccountNumber);
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
                                renderPost(post, username, pfp, post.accountNumber, 'profilePosts', userAccountNumber);
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching reposts:', error);
                    });

                gebid('profileUsername').textContent = `${data.username}`;



                gebid('pfp').src = pfp;
                gebid('accountnumber').textContent = ` (${data.accountNumber})`;
                gebid('bio').textContent = `${data.bio}`;
                gebid('following').textContent = `${Array.isArray(data.following) ? data.following.length : 0} Following`; // Ensure array
                gebid('followers').textContent = `${Array.isArray(data.followers) ? data.followers.length : 0} Followers`; // Ensure array
                
                gebid('changePfp').textContent = `${data.pfp}`;
            })
            .catch(error => console.error('Error fetching profile data:', error));
    }

    // Call fetchUserInfoAndSetupPage to ensure userAccountNumber is set before setupPage
    fetchUserInfoAndSetupPage();

    document.getElementById("followingLink").addEventListener("click", function (event) {
        event.preventDefault();
        if (profileAccountNumber) {window.location.href = `/following/${profileAccountNumber}`;}
    });
    document.getElementById("followerLink").addEventListener("click", function (event) {
        event.preventDefault();
        if (profileAccountNumber) {window.location.href = `/followers/${profileAccountNumber}`;}
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
        const username = gebid("profileUsername").textContent;
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

    gebid('followButton').addEventListener("click", async function (event) {
        event.preventDefault();
        try {
            const followButton = gebid('followButton');
            const isCurrentlyFollowed = followButton.textContent === 'Followed';

            const data = await apiRequest('/api/follow', 'POST', { recipientAccountNumber: profileAccountNumber });

            if (data.success) {
                if (isCurrentlyFollowed) {
                    // Reverse follow action (unfollow)
                    followButton.textContent = 'Follow';
                    followButton.style.backgroundColor = '';
                    const followersText = gebid('followers').textContent.trim();
                    const followersCount = parseInt(followersText.split(' ')[0]) || 0;
                    gebid('followers').textContent = ` ${followersCount - 1} Followers`;
                } else {
                    // Perform follow action
                    followButton.textContent = 'Followed';
                    followButton.style.backgroundColor = '#777777';
                    const followersText = gebid('followers').textContent.trim();
                    const followersCount = parseInt(followersText.split(' ')[0]) || 0;
                    gebid('followers').textContent = ` ${followersCount + 1} Followers`;
                }
            } else {
                alert(data.message || 'Failed to update follow status. Please try again.');
            }
        } catch (error) {
            console.error('Error updating follow status:', error);
            alert('Something went wrong. Please try again later.');
        }
    });

    gebid("postsButton").style.backgroundColor = "#777777";

    gebid("repostsButton").addEventListener("click", function () {
        const profilePosts = document.getElementById("profilePosts");
        const profileReposts = document.getElementById("profileReposts");

        profilePosts.style.display = "none";
        profileReposts.style.display = "flex";
        gebid("postsButton").style.backgroundColor = "white";
        gebid("repostsButton").style.backgroundColor = "#777777";

    });

    gebid("postsButton").addEventListener("click", function () {
        const profilePosts = document.getElementById("profilePosts");
        const profileReposts = document.getElementById("profileReposts");


        profilePosts.style.display = "flex";
        profileReposts.style.display = "none";
        gebid("postsButton").style.backgroundColor = "#777777";
        gebid("repostsButton").style.backgroundColor = "white";
    });

    // Add Open DM button functionality
    if (userAccountNumber !== profileAccountNumber) {
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
                    alert('Direct message opened successfully.');
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

    apiRequest('/api/getUserInfo', 'GET')
        .then(data => {
            if (data.success) {
                const user = data.user;
                initializeCreatePost(user.accountNumber);
                initializeGlobalButtons(user.accountNumber); // Initialize global buttons
            } else {
                window.location.href = '/';
            }
        })
        .catch(error => {
            console.error("Error fetching user info:", error);
        });

});