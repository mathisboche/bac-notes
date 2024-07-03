const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost/bac_calculator', { useNewUrlParser: true, useUnifiedTopology: true });

// User Schema
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  formData: Object
});

const User = mongoose.model('User', UserSchema);

// JWT Secret
const JWT_SECRET = 'your-secret-key';

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).send({ auth: false, message: 'No token provided.' });
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    
    req.userId = decoded.id;
    next();
  });
};

// Register route
app.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      username: req.body.username,
      password: hashedPassword,
      formData: {}
    });
    await user.save();
    res.status(201).send({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).send({ message: 'Error registering user' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(404).send({ message: 'User not found' });

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(401).send({ message: 'Invalid password' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: 86400 }); // 24 hours
    res.status(200).send({ auth: true, token: token, formData: user.formData });
  } catch (error) {
    res.status(500).send({ message: 'Error logging in' });
  }
});

// Get form data route
app.get('/formData', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).send({ message: 'User not found' });

    res.status(200).send({ formData: user.formData });
  } catch (error) {
    res.status(500).send({ message: 'Error fetching form data' });
  }
});

// Save form data route
app.post('/save', verifyToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.userId, { formData: req.body.formData }, { new: true });
    if (!user) return res.status(404).send({ message: 'User not found' });

    res.status(200).send({ message: 'Form data saved successfully' });
  } catch (error) {
    res.status(500).send({ message: 'Error saving form data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});