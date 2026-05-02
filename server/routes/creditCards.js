const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../supabase');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

function isValidUUID(uuid) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

// GET /api/credit-cards — list all cards
router.get('/', async (req, res) => {
  try {
    const { data: cards, error } = await supabase
      .from('credit_cards')
      .select('*, credit_card_transactions(*)')
      .eq('userId', req.userId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    
    // Map transactions into the cards
    const cardsWithTx = cards.map(c => ({
      ...c,
      transactions: c.credit_card_transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
    }));
    
    res.json(cardsWithTx);
  } catch (err) {
    console.error('Get credit cards error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/credit-cards — add a new card
router.post(
  '/',
  [
    body('cardName').notEmpty().withMessage('Card name is required'),
    body('creditLimit').isFloat({ min: 1 }).withMessage('Credit limit must be positive'),
    body('billingDate').isInt({ min: 1, max: 31 }).withMessage('Billing date must be 1–31'),
    body('lastFourDigits').optional().matches(/^\d{4}$/).withMessage('Must be 4 digits'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

      const { cardName, lastFourDigits, color } = req.body;
      const creditLimit = Number(req.body.creditLimit);
      const billingDate = Number(req.body.billingDate);
      const currentBalance = Number(req.body.currentBalance) || 0;

      const { data: card, error } = await supabase
        .from('credit_cards')
        .insert([{
          userId: req.userId,
          cardName,
          lastFourDigits: lastFourDigits || '0000',
          creditLimit,
          billingDate,
          color: color || '#8b5cf6',
          currentBalance,
        }])
        .select()
        .single();

      if (error) throw error;
      
      card.transactions = [];
      res.status(201).json(card);
    } catch (err) {
      console.error('Create credit card error:', err);
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

// POST /api/credit-cards/:id/transactions — log charge or payment
router.post(
  '/:id/transactions',
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('type').isIn(['charge', 'payment']).withMessage('Type must be charge or payment'),
    body('category').optional().notEmpty(),
    body('note').optional().isString(),
  ],
  async (req, res) => {
    try {
      if (!isValidUUID(req.params.id)) {
        return res.status(400).json({ message: 'Invalid card id.' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

      const { data: card } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('id', req.params.id)
        .eq('userId', req.userId)
        .single();

      if (!card) return res.status(404).json({ message: 'Card not found.' });

      const amount = Number(req.body.amount);
      const { type, category, note, date } = req.body;

      // Insert transaction
      const { data: tx, error: txError } = await supabase
        .from('credit_card_transactions')
        .insert([{
          creditCardId: card.id,
          amount,
          type,
          category: category || 'Other',
          note: note || '',
          date: date ? new Date(date).toISOString() : new Date().toISOString()
        }])
        .select()
        .single();

      if (txError) throw txError;

      // Update balance
      let newBalance = Number(card.currentBalance);
      if (type === 'charge') {
        newBalance += amount;
      } else {
        newBalance = Math.max(0, newBalance - amount);
      }

      const { data: updatedCard } = await supabase
        .from('credit_cards')
        .update({ currentBalance: newBalance })
        .eq('id', card.id)
        .select()
        .single();

      // Return card with transactions
      const { data: transactions } = await supabase
        .from('credit_card_transactions')
        .select('*')
        .eq('creditCardId', card.id)
        .order('date', { ascending: false });

      updatedCard.transactions = transactions || [];
      res.status(201).json(updatedCard);
    } catch (err) {
      console.error('Add transaction error:', err);
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

// DELETE /api/credit-cards/:id/transactions/:txId — delete a transaction
router.delete('/:id/transactions/:txId', async (req, res) => {
  try {
    if (!isValidUUID(req.params.id) || !isValidUUID(req.params.txId)) {
      return res.status(400).json({ message: 'Invalid transaction id.' });
    }

    const { data: card } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('id', req.params.id)
      .eq('userId', req.userId)
      .single();

    if (!card) return res.status(404).json({ message: 'Card not found.' });

    const { data: tx } = await supabase
      .from('credit_card_transactions')
      .select('*')
      .eq('id', req.params.txId)
      .eq('creditCardId', card.id)
      .single();

    if (!tx) return res.status(404).json({ message: 'Transaction not found.' });

    // Reverse balance
    let newBalance = Number(card.currentBalance);
    if (tx.type === 'charge') {
      newBalance = Math.max(0, newBalance - Number(tx.amount));
    } else {
      newBalance += Number(tx.amount);
    }

    await supabase.from('credit_cards').update({ currentBalance: newBalance }).eq('id', card.id);
    await supabase.from('credit_card_transactions').delete().eq('id', tx.id);

    // Return updated card
    const { data: updatedCard } = await supabase.from('credit_cards').select('*').eq('id', card.id).single();
    const { data: transactions } = await supabase.from('credit_card_transactions').select('*').eq('creditCardId', card.id).order('date', { ascending: false });
    
    updatedCard.transactions = transactions || [];
    res.json(updatedCard);
  } catch (err) {
    console.error('Delete tx error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/credit-cards/:id — delete card
router.delete('/:id', async (req, res) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ message: 'Invalid card id.' });
    }

    const { data: card } = await supabase
      .from('credit_cards')
      .select('id')
      .eq('id', req.params.id)
      .eq('userId', req.userId)
      .single();

    if (!card) return res.status(404).json({ message: 'Card not found.' });
    await supabase.from('credit_cards').delete().eq('id', req.params.id);
    res.json({ message: 'Card deleted.' });
  } catch (err) {
    console.error('Delete card error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
