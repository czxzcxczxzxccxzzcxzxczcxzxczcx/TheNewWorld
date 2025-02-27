import React, { useState, useEffect } from 'react';

function App() {
  // State hooks to manage the panels and user
  const [user, setUser] = useState(null);
  const [showLoginPanel, setShowLoginPanel] = useState(true);
  const [showNewAccPanel, setShowNewAccPanel] = useState(false);

  // useEffect to mimic the DOMContentLoaded behavior
  useEffect(() => {
    const storedUser = JSON.parse(sessionStorage.getItem("user"));
    if (storedUser) {
      window.location.href = '/home';  // Redirect if user is logged in
    } else {
      setUser(null);  // Set user state to null if not logged in
    }
  }, []);

  // Handle switching between login panel and new account panel
  const handleLoginClick = () => {
    setShowLoginPanel(true);
    setShowNewAccPanel(false);
  };

  const handleNewAccClick = () => {
    setShowLoginPanel(false);
    setShowNewAccPanel(true);
  };

  // Handle login form submission
  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    const fullName = event.target.username.value;
    const password = event.target.password.value;

    if (fullName && password) {
      try {
        const response = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, password }),
        });
        const data = await response.json();
        if (data.success) {
          window.location.href = '/home';
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  // Handle new account form submission
  const handleNewAccSubmit = async (event) => {
    event.preventDefault();
    const fullName = event.target.username.value;
    const password = event.target.password.value;

    if (fullName && password) {
      try {
        const response = await fetch('/newAccount', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, password }),
        });
        const data = await response.json();
        if (data.success) {
          window.location.href = '/home';
        } else {
          alert(data.message || 'Error creating account');
        }
      } catch (error) {
        console.error('Error during account creation:', error);
        alert('There was an error. Please try again.');
      }
    }
  };

  // Render the component
  return (
    <div>
      {/* Login Panel */}
      {showLoginPanel && (
        <div id="loginPanel" style={{ display: 'flex' }}>
          <h2>Login</h2>
          <form id="loginForm" onSubmit={handleLoginSubmit}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
            />
            <button type="submit">Login</button>
          </form>
          <button id="newAccount" onClick={handleNewAccClick}>
            Create New Account
          </button>
        </div>
      )}

      {/* New Account Panel */}
      {showNewAccPanel && (
        <div id="newAccPanel" style={{ display: 'flex' }}>
          <h2>Create New Account</h2>
          <form id="newAccForm" onSubmit={handleNewAccSubmit}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
            />
            <button type="submit">Create Account</button>
          </form>
          <button id="login" onClick={handleLoginClick}>
            Back to Login
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
