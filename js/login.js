document.addEventListener("DOMContentLoaded", function() {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const loginPanel = document.getElementById('loginPanel')
    const newAccPanel = document.getElementById('newAccPanel')
    const newAccButton = document.getElementById('newAccount')
    const loginButton  = document.getElementById('login')



    if (user) 
    {
         window.location.href = '/home';  
        // loginPanel.style.display = 'flex'; 
    } 
    else
    {
        loginPanel.style.display = 'flex';
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

    document.getElementById('viewtest').addEventListener("click", function (event) 
    {
        fetch('/viewAllUsers', 
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },

            })
    });

    document.getElementById('newAccForm').onsubmit = function(event) 
    {
        event.preventDefault(); 

        const fullName = document.getElementById("newAccUsername").value;
        const password = document.getElementById("newAccPassword").value;        // if (fullName && accNumber && password && !isNaN(accNumber)) 

        if (fullName  && password)
        {
            console.log(1);
            fetch('/newAccount', 
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fullName, password })  
                

            })
            
            .then(response => response.json()).then(data => 
            {
                // window.location.href = '/logged'; 

                console.log("Response from server:", data);
                if (data.success) 
                {
                    console.log(1);

                    window.location.href = '/home'; 

                    sessionStorage.setItem("user", JSON.stringify({
                        username: data.user.username,  
                        accNumber: data.user.accountNumber,
                    }));
                    
                    console.log("Login successful for account number:", accNumber);
                }
            
            });
        }
    }
    
    document.getElementById('loginForm').onsubmit = function(event) 
    {
        event.preventDefault(); 

        const fullName = document.getElementById("loginUsername").value;
        const password = document.getElementById("loginPassword").value;

        


        if (fullName && password) 
        {
            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fullName, password })  
            })
            .then(response => response.json()).then(data => 
            {
                console.log("Response from server:", data);
                if (data.success) 
                {
                    sessionStorage.setItem("user", JSON.stringify({
                        username: data.user.username,
                        accNumber: data.user.accountNumber,                    
                    }));
                    window.location.href = '/home'; 

                } 
                else 
                {

                    // document.getElementById("status").textContent = data.message || "Invalid account number or password.";
                }
            })
            .catch(error => 
            {
                console.error('Error:', error);
                // document.getElementById("status").textContent = "Something went wrong. Please try again later.";
            });
        } 
        else 
        {
            // document.getElementById("status").textContent = "Invalid input. Please check your details.";
        }
        
    };
});
