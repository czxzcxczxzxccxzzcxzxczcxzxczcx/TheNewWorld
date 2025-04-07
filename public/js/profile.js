import { apiRequest } from './utils/apiRequest.js';
import { renderPost, changeEdit } from './utils/renderPost.js';


document.addEventListener("DOMContentLoaded", function () {
    const profileAccountNumber = window.location.pathname.split('/')[2];
    var gebid = document.getElementById.bind(document);
    let userAccountNumber;


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
            .then(async data => {
                const username = data.username;
                const accountNumber = profileAccountNumber;
                const pfp = data.pfp;
                let postsCount = 0;

                if (userAccountNumber === accountNumber) { 
                    gebid('profileEdit').style.display = "block"; 
                } else {
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
                        // Sort posts by 'createdAt' in descending order
                        data.posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
                        data.posts.forEach(post => {
                            postsCount++;
                            gebid('posts').textContent = ` ${postsCount} Posts`;
                            renderPost(post, username, pfp, accountNumber, 'profile',userAccountNumber);
                        });
                    }
                });
                gebid('username').textContent = `${data.username}`;
                gebid('pfp').src = pfp;
                gebid('accountnumber').textContent = ` (${data.accountNumber})`;
                gebid('bio').textContent = `${data.bio}`;
                gebid('following').textContent = `${Array.isArray(data.following) ? data.following.length : 0} Following`; // Ensure array
                gebid('followers').textContent = `${Array.isArray(data.followers) ? data.followers.length : 0} Followers`; // Ensure array
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

    document.getElementById("followingLink").addEventListener("click", function (event) {
        event.preventDefault();
        if (userAccountNumber) {window.location.href = `/following/${userAccountNumber}`;}
    });
    document.getElementById("followerLink").addEventListener("click", function (event) {
        event.preventDefault();
        if (userAccountNumber) {window.location.href = `/followers/${userAccountNumber}`;}
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


    setupPage();
});