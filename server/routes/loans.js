const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../supabase');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

function isValidUUID(uuid) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

// POST /api/loans - Create new loan/borrowing
router.post(
  '/',
  [
    body('type').isIn(['Lent', 'Borrowed', 'AutoSave']).withMessage('Invalid type'),
    body('partyName').notEmpty().withMessage('Person or App name is required'),
    body('principalAmount').isFloat({ min: 0 }).withMessage('Principal must be positive'),
    body('interestRate').isFloat({ min: 0 }).withMessage('Interest rate must be positive'),
    body('durationMonths').isInt({ min: 1 }).withMessage('Duration must be at least 1 month'),
    body('paymentDay').isInt({ min: 1, max: 31 }).withMessage('Payment day must be between 1 and 31'),
    body('startDate').optional().isISO8601().withMessage('Invalid start date'),
    body('endDate').optional().isISO8601().withMessage('Invalid end date'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { type, partyName, principalAmount, interestRate, durationMonths, startDate, endDate, paymentDay } = req.body;

      // EMI Calculation
      let monthlyEMI;
      let totalAmount;

      if (type === 'AutoSave') {
        monthlyEMI = principalAmount;
        totalAmount = principalAmount * durationMonths;
      } else if (interestRate > 0) {
        const r = (interestRate / 12) / 100;
        const n = durationMonths;
        const P = principalAmount;
        
        monthlyEMI = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        totalAmount = monthlyEMI * n;
      } else {
        monthlyEMI = principalAmount / durationMonths;
        totalAmount = principalAmount;
      }

      const start = startDate ? new Date(startDate) : new Date();
      
      let calcEndDate = endDate;
      if (!calcEndDate) {
        const temp = new Date(start);
        temp.setMonth(temp.getMonth() + durationMonths);
        calcEndDate = temp.toISOString();
      } else {
        calcEndDate = new Date(calcEndDate).toISOString();
      }

      const pDay = paymentDay || start.getDate();

      const { data: loan, error } = await supabase
        .from('loans')
        .insert([{
          userId: req.userId,
          type,
          partyName,
          principalAmount,
          interestRate,
          durationMonths,
          startDate: start.toISOString(),
          endDate: calcEndDate,
          paymentDay: pDay,
          monthlyEMI: Math.round(monthlyEMI * 100) / 100,
          totalAmount: Math.round(totalAmount * 100) / 100,
        }])
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(loan);
    } catch (err) {
      console.error('Create loan error:', err);
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

// GET /api/loans - get all loans for user
router.get('/', async (req, res) => {
  try {
    const { data: loans } = await supabase
      .from('loans')
      .select('*')
      .eq('userId', req.userId)
      .order('startDate', { ascending: false });
    res.json(loans || []);
  } catch (err) {
    console.error('Get loans error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/loans/:id - update loan status
router.put(
  '/:id',
  [body('status').optional().isIn(['Active', 'Completed']).withMessage('Invalid status')],
  async (req, res) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ message: 'Invalid loan id.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { data: loan, error } = await supabase
      .from('loans')
      .update({ status: req.body.status })
      .eq('id', req.params.id)
      .eq('userId', req.userId)
      .select()
      .single();

    if (error || !loan) {
      return res.status(404).json({ message: 'Loan not found.' });
    }

    res.json(loan);
  } catch (err) {
    console.error('Update loan error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/loans/:id - delete loan
router.delete('/:id', async (req, res) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ message: 'Invalid loan id.' });
    }

    const { data: loan } = await supabase
      .from('loans')
      .select('id')
      .eq('id', req.params.id)
      .eq('userId', req.userId)
      .single();

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found.' });
    }

    await supabase.from('loans').delete().eq('id', req.params.id);
    res.json({ message: 'Loan deleted.' });
  } catch (err) {
    console.error('Delete loan error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
