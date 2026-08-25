require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const chatRoutes = require('./routes/chat');

const app = express();

const PORT = process.env.PORT || 5002;


// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());


// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is running',
    port: PORT
  });
});


// CHAT ROUTES
app.use('/api/chat', chatRoutes);


// MONGODB CONNECTION
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000
})
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  });

mongoose.connection.on('error', (error) => {
  console.error('MongoDB error:', error.message);
});


// Start Server 
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});