import { apiRequest } from './utils/apiRequest.js';

document.addEventListener("DOMContentLoaded", function () {
    const loginPanel = document.getElementById('loginPanel');
    const newAccPanel = document.getElementById('newAccPanel');
    const newAccButton = document.getElementById('newAccount');
    const loginButton = document.getElementById('login');
    const logo = document.getElementById('viewtest');

    logo.style.display='block';

    apiRequest('/api/getUserInfo', 'GET').then(data => {
        if (data.success) {
            window.location.href = '/home';
        } else {
            
            loginPanel.style.display = 'flex'
        }
    })
    .catch(error => {
        console.error("Error fetching user info:", error);
    });

    document.addEventListener("click", function (event) {
        if (event.target === loginButton) {
            loginPanel.style.display = 'flex';
            newAccPanel.style.display = 'none';
        } else if (event.target === newAccButton) {
            loginPanel.style.display = 'none';
            newAccPanel.style.display = 'flex';
        }
    });

    document.getElementById('newAccForm').onsubmit = async function (event) {
        event.preventDefault();

        const fullName = document.getElementById("newAccUsername").value;
        const password = document.getElementById("newAccPassword").value;

        if (fullName && password) {
            console.log("Form submitted, creating account...");

            try {
                const data = await apiRequest('/api/newAccount', 'POST', { fullName, password });
                console.log("Response from server:", data);

                if (data.success) {
                    console.log("Account created successfully");
                    window.location.href = '/home';
                } else {
                    alert("Error creating account: " + (data.message || "Unknown error"));
                }
            } catch (error) {
                console.error("Error during account creation:", error);
                alert("There was an error processing your request. Please try again later.");
            }
        } else {
            alert("Please fill in all fields.");
        }
    };


    document.getElementById('loginForm').onsubmit = async function (event) {
        event.preventDefault();

        const fullName = document.getElementById("loginUsername").value;
        const password = document.getElementById("loginPassword").value;
        const status =  document.getElementById("loginStatus")

        if (fullName && password) {
            try {
                const data = await apiRequest('/api/login', 'POST', { fullName, password });
                if (data.success) {
                    window.location.href = '/home';
                } else {
                    alert("Invalid username or password");
                }
            } catch (error) {
               alert("There was an error processing your request. Please try again later.");
            }
        } else {
            alert("Please fill in all fields.");
        }
    };
});