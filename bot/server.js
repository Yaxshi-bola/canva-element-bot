/* -------------------------------------------------------------
 * Render Web Service Entrypoint
 * Express Server + Telegram Bot + Custom Elements API
 * ------------------------------------------------------------- */

const express = require('express');
const cors = require('cors');
const db = require('./database');
const app = express();
const PORT = process.env.PORT || 3000;

// Import Telegram Bot
require('./bot');

app.use(cors());
app.use(express.json());

// Render Health Check Endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Canva Element Kodlari Telegram Bot',
    author: 'Zuhra Olimova',
    uptime: process.uptime()
  });
});

// API Endpoint for Dynamic Custom Elements added by Admin
app.get('/api/custom-elements', (req, res) => {
  const elements = db.getCustomElements();
  res.json({
    success: true,
    count: elements.length,
    elements: elements
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Bot Web Server is running on port ${PORT}`);
});
