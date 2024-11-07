const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', (event) => {
  event.preventDefault(); // Prevent form submission

  const voter_id = document.getElementById('voter-id').value;
  const password = document.getElementById('password').value;

  const headers = {
    'Content-Type': 'application/json'
  };

  // Use POST method to send login data
  fetch('http://127.0.0.1:8000/login', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ voter_id: voter_id, password: password }) // Send credentials in the body
  })
  .then(response => {
    if (!response.ok) {
      // If response is not ok, throw an error
      return response.json().then(err => {
        throw new Error(err.detail || 'Login failed');
      });
    }
    return response.json(); // Parse the JSON response
  })
  .then(data => {
    // Check the user role and store the token in local storage
    if (data.role === 'admin') {
      localStorage.setItem('jwtTokenAdmin', data.token);
      window.location.replace('http://127.0.0.1:8080/admin.html');
    } else if (data.role === 'user') {
      localStorage.setItem('jwtTokenVoter', data.token);
      window.location.replace('http://127.0.0.1:8080/index.html');
    } else {
      throw new Error('Unexpected user role');
    }
  })
  .catch(error => {
    console.error('Login failed:', error.message);
    alert(`Login failed: ${error.message}`);
  });
});
