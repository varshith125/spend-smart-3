console.log("==================================================");
console.log("🚀 STARTING NODE JS SERVER ON RENDER - LINE 1");
console.log("==================================================");
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Global crash handlers to prevent silent exits on Render
process.on('uncaughtException', (err) => {
  console.error('🚨 FATAL UNCAUGHT EXCEPTION:');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 FATAL UNHANDLED REJECTION:');
  console.error(reason);
  process.exit(1);
});

const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const insightRoutes = require('./routes/insights');
const loanRoutes = require('./routes/loans');
const creditCardRoutes = require('./routes/creditCards');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS — allow local dev + deployed Vercel frontend
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  process.env.CLIENT_URL, // your Vercel URL, set in Render env vars
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/credit-cards', creditCardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
