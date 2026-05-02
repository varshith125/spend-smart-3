const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const supabase = require('../supabase');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Generate JWT token
function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// POST /api/auth/signup
router.post(
  '/signup',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { name, email, password } = req.body;

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(400).json({ message: 'An account with this email already exists.' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const { data: user, error } = await supabase
        .from('users')
        .insert([{ name, email, password: hashedPassword }])
        .select()
        .single();

      if (error || !user) {
        throw error;
      }

      // Generate token
      const token = generateToken(user.id);

      res.status(201).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          monthlyBudget: user.monthlyBudget,
          yearlyIncome: user.yearlyIncome,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      console.error('Signup error:', err);
      res.status(500).json({ message: 'Server error. Please try again.' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { email, password } = req.body;
      console.log(`[LOGIN ATTEMPT] Email: ${email}`);

      // Find user
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password.' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log(`[LOGIN FAILED] Password mismatch for: ${email}`);
        return res.status(400).json({ message: 'Invalid email or password.' });
      }

      console.log(`[LOGIN SUCCESS] User: ${user.email}`);

      // Generate token
      const token = generateToken(user.id);

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          monthlyBudget: user.monthlyBudget,
          yearlyIncome: user.yearlyIncome,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Server error. Please try again.' });
    }
  }
);

// GET /api/auth/me — get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, "monthlyBudget", "yearlyIncome", "createdAt"')
      .eq('id', req.userId)
      .single();

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      monthlyBudget: user.monthlyBudget,
      yearlyIncome: user.yearlyIncome,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PATCH /api/auth/settings — update settings (budget & income)
router.patch(
  '/settings',
  authMiddleware,
  [
    body('monthlyBudget').optional().isNumeric().withMessage('Budget must be a number'),
    body('yearlyIncome').optional().isNumeric().withMessage('Income must be a number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const updates = {};
      if (req.body.monthlyBudget !== undefined) updates.monthlyBudget = req.body.monthlyBudget;
      if (req.body.yearlyIncome !== undefined) updates.yearlyIncome = req.body.yearlyIncome;

      const { data: user, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', req.userId)
        .select('id, name, email, "monthlyBudget", "yearlyIncome", "createdAt"')
        .single();

      if (error || !user) {
        throw error;
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        monthlyBudget: user.monthlyBudget,
        yearlyIncome: user.yearlyIncome,
        createdAt: user.createdAt,
      });
    } catch (err) {
      console.error('Update settings error:', err);
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

module.exports = router;
