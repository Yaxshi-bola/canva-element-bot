/* -------------------------------------------------------------
 * Render Web Service Entrypoint
 * Express Server + Telegram Bot Health Monitor
 * ------------------------------------------------------------- */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Import Telegram Bot
require('./bot');

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

app.listen(PORT, () => {
  console.log(`🚀 Bot Web Server is running on port ${PORT}`);
});
