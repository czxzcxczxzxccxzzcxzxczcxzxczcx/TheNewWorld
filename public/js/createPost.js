document.addEventListener("DOMContentLoaded", function() {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const accountNumber = user.accNumber;

    if (user) 
    {
        //  window.location.href = '/home';  
        // loginPanel.style.display = 'flex'; 
    } 
    else
    {
        window.location.href = '/';  
    }

    document.getElementById("logoutButton").addEventListener("click",function (event)
    {
        event.preventDefault();
        sessionStorage.removeItem("user");
        window.location.href = '/';
    })


    document.getElementById("profileButton").addEventListener("click",function (event)
    {
        event.preventDefault();
        window.location.href = `/profile/${user.accNumber}`;
    })


    document.getElementById('checkPost').addEventListener("click",function()
    {
        // const postId = document.getElementById("titleText").value;
        fetch('/viewAllPosts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // body: JSON.stringify({ postId })  
        })
    })


    document.getElementById('createPost').addEventListener("click", function() 
    {
        const title = document.getElementById("titleText").value;
        const content = document.getElementById("bodyText").value;
        
        console.log(accountNumber)

        if (title && content) 
        {
            fetch('/createPost', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({accountNumber, title, content })  
            })
            .then(response => response.json()).then(data => 
            {
                console.log("Response from server:", data);
                if (data.success) 
                {
                    // window.location.href = '/home'; 

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
    })
    document.getElementById('checkPost').addEventListener("click", function (event) 
    {
        fetch('/viewAllPosts', 
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },

            })
    });
});
