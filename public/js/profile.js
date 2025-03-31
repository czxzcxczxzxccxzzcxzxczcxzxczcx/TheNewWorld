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
            .then(data => {
                const username = data.username;
                const accountNumber = profileAccountNumber;
                const pfp = data.pfp;
                let postsCount = 0;

                if (userAccountNumber === accountNumber) { gebid('profileEdit').style.display = "block"; }

                apiRequest('/api/getUserPosts', 'POST', { accountNumber })
                    .then(data => {
                        if (data.success) {
                            data.posts.forEach(post => {
                                postsCount++;
                                gebid('posts').textContent = ` ${postsCount} Posts`;
                                renderPost(post, username, pfp, accountNumber);

                            });
                        }
                    });

                gebid('username').textContent = `${data.username}`;
                gebid('pfp').src = pfp;
                gebid('accountnumber').textContent = ` (${data.accountNumber})`;
                gebid('bio').textContent = `${data.bio}`;
                gebid('following').textContent = `${data.following} Following`;
                gebid('followers').textContent = ` ${data.followers} Followers`;
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

    setupPage();
});