const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware to serve static files
app.use('/static', express.static(path.join(__dirname, 'public')));

// Authorization middleware to verify JWT
const authorizeUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from Bearer

  if (!token) {
    return res.status(401).send('<h1 align="center">Login to Continue</h1>');
  }

  try {
    // Verify and decode the token using jwt.verify
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY, { algorithms: ['HS256'] });
    req.user = decodedToken;
    next(); // Proceed to the next middleware
  } catch (error) {
    return res.status(401).json({ message: 'Invalid authorization token' });
  }
};

// Routes to serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/login.html'));
});

app.get('/admin.html', authorizeUser, (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/admin.html'));
});

app.get('/index.html', authorizeUser, (req, res) => {
  res.sendFile(path.join(__dirname, 'src/html/index.html'));
});

// Routes to serve JavaScript files
app.get('/js/:script', (req, res) => {
  res.sendFile(path.join(__dirname, `src/js/${req.params.script}`));
});

// Routes to serve CSS files
app.get('/css/:style', (req, res) => {
  res.sendFile(path.join(__dirname, `src/css/${req.params.style}`));
});

// Routes to serve assets like images
app.get('/assets/:image', (req, res) => {
  res.sendFile(path.join(__dirname, `src/assets/${req.params.image}`));
});

// Routes to serve JavaScript bundles
app.get('/dist/:bundle', (req, res) => {
  res.sendFile(path.join(__dirname, `src/dist/${req.params.bundle}`));
});

// Route to serve the favicon
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/favicon.ico'));
});

// Start the server on port 8080
app.listen(8080, () => {
  console.log('Server listening on http://localhost:8080');
});


