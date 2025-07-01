require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');

const authRoutes = require('/home/user/Event-koi/routes/auth');
const eventRoutes = require('/home/user/Event-koi/routes/events');
const userRoutes = require('/home/user/Event-koi/routes/users');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware for parsing JSON request bodies
app.use(express.json());

// Session Middleware
app.use(session({
  secret: 'your-secret-key', // Replace with a strong, random secret key
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Use authentication routes
app.use('/auth', authRoutes);

app.use('/events', eventRoutes);
app.use('/users', userRoutes);
app.get('/', (req, res) => {
  res.send('Event Koi?! Backend');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});