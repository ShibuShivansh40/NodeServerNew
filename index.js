const express = require('express');
const cors = require('cors');
const app = express();
const sequelize = require('./src/db'); // Central DB connection
const Invoice = require('./src/models/Invoice'); // Force load models
const Client = require('./src/models/Client');   // Force load models
const Product = require('./src/models/Product'); // Force load models
const invoiceRoutes = require('./src/routes/invoiceRoutes');

require('dotenv').config();

app.use(cors()); // Allow your Android app to connect
app.use(express.json());

// API key middleware - MUST be before routes to apply to all /api calls
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorized - Invalid API key' });
  }
  next();
});

// Routes - after middleware
app.use('/api', invoiceRoutes);

const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Database sync failed:', err);
});

// Error handler - at the bottom
app.use((err, req, res, next) => {
  console.error("SERVER CRASH ERROR:", err.stack);
  res.status(500).json({ success: false, error: err.message });
});
