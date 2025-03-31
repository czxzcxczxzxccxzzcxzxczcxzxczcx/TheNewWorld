document.addEventListener("DOMContentLoaded", function () {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const loginPanel = document.getElementById('loginPanel');
    const newAccPanel = document.getElementById('newAccPanel');
    const newAccButton = document.getElementById('newAccount');
    const loginButton = document.getElementById('login');

    // Reusable API request function
    async function apiRequest(url, method = 'GET', body = null) {
        const options = {method, headers: { 'Content-Type': 'application/json' },};

        if (body) {options.body = JSON.stringify(body);}

        try {
            const response = await fetch(url, options);
            return await response.json();
        } catch (error) {
            console.error(`Error during API request to ${url}:`, error);
            throw error;
        }
    }

    if (user) {
        window.location.href = '/home'; } else { loginPanel.style.display = 'flex';
    }

    document.addEventListener("click", function (event) {
        if (event.target === loginButton) {
            loginPanel.style.display = 'flex';
            newAccPanel.style.display = 'none';
        } else if (event.target === newAccButton) {
            loginPanel.style.display = 'none';
            newAccPanel.style.display = 'flex';
        }
    });

    document.getElementById('viewtest').addEventListener("click", async function (event) {
        try {
            await apiRequest('/api/viewAllUsers', 'POST'); } catch (error) { console.error("Error fetching all users:", error);
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
                    status.textContent = "Invalid username or password";
                    console.log(1);
                }
            } catch (error) {
                console.error('Error during login:', error);
                status.textContent = "Something went wrong";
            }
        } else {
            status.textContent = "invalid input";

        }
    };
});