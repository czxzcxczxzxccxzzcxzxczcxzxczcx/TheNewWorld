import { apiRequest } from './utils/apiRequest.js';
import { initializeCreatePost } from './utils/createPostHandler.js';
import { renderBar, initializeGlobalButtons } from './utils/renderBar.js';

renderBar();

document.addEventListener("DOMContentLoaded", function () {
    let accountNumber;

    apiRequest('/api/getUserInfo', 'GET')
        .then(data => {
            if (data.success) {
                const user = data.user;
                accountNumber = user.accountNumber;
                initializeCreatePost(user.accountNumber);
                initializeGlobalButtons(accountNumber); // Initialize global buttons
            } else {
                window.location.href = '/';
            }
        })
        .catch(error => {
            console.error("Error fetching user info:", error);
        });
    apiRequest('/api/verify', 'GET').then(data => {
        if (!data.success) {
            window.location.href = '/home';
        } else {
            const adminButton = document.getElementById('adminPanelButton');
            if (adminButton) {
                adminButton.style.display = 'block'; // Set display to block if authorized
            }
        }
    }).catch(error => {
        console.error("Error fetching user info:", error);
    });

    document.getElementById("updateData").addEventListener("click", async function (event) {
        const accountNumber = Number(document.getElementById('accountNumber').value); // Convert to number
        const field = document.getElementById('userDataType').value;
        const value = document.getElementById('userDataValue').value;

        if (!accountNumber || !field || !value) {
            alert('Please fill in all fields.');
            return;
        }

        apiRequest('/api/updateData', 'POST', { accountNumber, field, value })
            .then(data => {
                if (data.success) {
                    alert('User data updated successfully!');
                } else {
                    alert('Failed to update user data.');
                }
            })
            .catch(error => {
                console.error('Error making update request:', error);
                alert('An error occurred while updating user data.');
            });
    });

    document.getElementById("logoutButton").addEventListener("click", async function (event) {
        event.preventDefault();
        try {
            const data = await apiRequest('/api/logout', 'POST');
            if (data.success) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    });
    // Update post data
    document.getElementById("updatePost").addEventListener("click", async function (event) {
        const postId = document.getElementById('postId').value; // Use accountNumber input for postId
        const field = document.getElementById('postDataType').value;
        const value = document.getElementById('postDataValue').value;

        if (!postId || !field || !value) {
            alert('Please fill in all fields.');
            return;
        }

        apiRequest('/api/updatePost', 'POST', { postId, field, value })
            .then(data => {
                if (data.success) {
                    alert('Post data updated successfully!');
                } else {
                    console.error('Error updating post data:', data.message);
                    alert('Failed to update post data.');
                }
            })
            .catch(error => {
                console.error('Error making update request:', error);
                alert('An error occurred while updating post data.');
            });
    });

    // Fix user data
    document.getElementById("fixUserData").addEventListener("click", async function () {
        apiRequest('/api/fixUserData', 'POST')
            .then(data => {
                if (data.success) {
                    alert('User data fixed successfully!');
                } else {
                    console.error('Error fixing user data:', data.message);
                    alert('Failed to fix user data.');
                }
            })
            .catch(error => {
                console.error('Error fixing user data:', error);
                alert('An error occurred while fixing user data.');
            });
    });
    document.getElementById("profileButton").addEventListener("click", function (event) {
        event.preventDefault();
        if (accountNumber) { window.location.href = `/profile/${accountNumber}`; }
    });
    // Fix post data
    document.getElementById("fixPostData").addEventListener("click", async function () {
        apiRequest('/api/fixPostData', 'POST')
            .then(data => {
                if (data.success) {
                    alert('Post data fixed successfully!');
                } else {
                    console.error('Error fixing post data:', data.message);
                    alert('Failed to fix post data.');
                }
            })
            .catch(error => {
                console.error('Error fixing post data:', error);
                alert('An error occurred while fixing post data.');
            });
    });

    // View posts
    document.getElementById("viewPosts").addEventListener("click", async function () {
        apiRequest('/api/getAllPosts', 'GET')
            .then(data => {
                if (data.success) {
                    alert('Posts fetched successfully! Check console for details.');
                } else {
                    console.error('Error fetching posts:', data.message);
                    alert('Failed to fetch posts.');
                }
            })
            .catch(error => {
                console.error('Error fetching posts:', error);
                alert('An error occurred while fetching posts.');
            });
    });

    // View users
    document.getElementById("viewUsers").addEventListener("click", async function () {
        apiRequest('/api/getAllUsers', 'GET')
            .then(data => {
                if (data.success) {
                    console.log(data); // Log the users to the console
                    alert('Users fetched successfully! Check console for details.');
                } else {
                    console.error('Error fetching users:', data.message);
                    alert('Failed to fetch users.');
                }
            })
            .catch(error => {
                console.error('Error fetching users:', error);
                alert('An error occurred while fetching users.');
            });
    });

     document.getElementById("viewMessages").addEventListener("click", async function () {
        apiRequest('/api/getAllMessages', 'GET')
            .then(data => {
                if (data.success) {
                    console.log(data); // Log the users to the console
                    alert('Users fetched successfully! Check console for details.');
                } else {
                    console.error('Error fetching users:', data.message);
                    alert('Failed to fetch users.');
                }
            })
            .catch(error => {
                console.error('Error fetching users:', error);
                alert('An error occurred while fetching users.');
            });
    });

    // Check if user is head admin and show admin management section
    async function checkHeadAdminAccess() {
        try {
            const userInfo = await apiRequest('/api/getUserInfo', 'GET');
            if (userInfo.success) {
                const user = await apiRequest('/api/get/profile/' + userInfo.user.accountNumber, 'GET');
                if (user.adminRole === 'headAdmin') {
                    document.getElementById('adminManagementSection').style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Error checking head admin access:', error);
        }
    }

    // Call the function to check head admin access
    checkHeadAdminAccess();

    // Grant Admin Event Listener
    document.getElementById("grantAdminButton").addEventListener("click", async function (event) {
        event.preventDefault();
        const targetAccountNumber = document.getElementById('grantAdminAccountNumber').value;

        if (!targetAccountNumber) {
            alert('Please enter an account number.');
            return;
        }

        try {
            const data = await apiRequest('/api/grantAdmin', 'POST', { targetAccountNumber });
            if (data.success) {
                alert(`Admin permissions granted successfully to ${data.user.username}!`);
                document.getElementById('grantAdminAccountNumber').value = '';
            } else {
                alert('Failed to grant admin permissions: ' + data.message);
            }
        } catch (error) {
            console.error('Error granting admin permissions:', error);
            alert('An error occurred while granting admin permissions.');
        }
    });

    // Revoke Admin Event Listener
    document.getElementById("revokeAdminButton").addEventListener("click", async function (event) {
        event.preventDefault();
        const targetAccountNumber = document.getElementById('revokeAdminAccountNumber').value;

        if (!targetAccountNumber) {
            alert('Please enter an account number.');
            return;
        }

        try {
            const data = await apiRequest('/api/revokeAdmin', 'POST', { targetAccountNumber });
            if (data.success) {
                alert(`Admin permissions revoked successfully from ${data.user.username}!`);
                document.getElementById('revokeAdminAccountNumber').value = '';
            } else {
                alert('Failed to revoke admin permissions: ' + data.message);
            }
        } catch (error) {
            console.error('Error revoking admin permissions:', error);
            alert('An error occurred while revoking admin permissions.');
        }
    });

    // View Users with Roles Event Listener
    document.getElementById("viewUsersWithRoles").addEventListener("click", async function (event) {
        event.preventDefault();

        try {
            const data = await apiRequest('/api/getUsersWithRoles', 'GET');
            if (data.success) {
                console.log('Users with roles:', data.users);
                
                // Create a nice formatted display
                let usersList = "Users and their roles:\n\n";
                data.users.forEach(user => {
                    const roleEmoji = user.adminRole === 'headAdmin' ? '👑' : user.adminRole === 'admin' ? '🛡️' : '👤';
                    usersList += `${roleEmoji} ${user.username} (${user.accountNumber}) - ${user.adminRole}\n`;
                });
                
                alert(usersList);
            } else {
                alert('Failed to fetch users with roles: ' + data.message);
            }
        } catch (error) {
            console.error('Error fetching users with roles:', error);
            alert('An error occurred while fetching users with roles.');
        }
    });
});