/**
 * SpendSmart Seed Script
 * Generates realistic Indian software employee expense data
 * from January 2025 to March 2026.
 *
 * Usage:
 *   node seed.js <email>
 *
 * Example:
 *   node seed.js test@example.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Expense = require('./models/Expense');
const User = require('./models/User');

const userEmail = process.argv[2];

if (!userEmail) {
  console.error('❌  Please provide your account email as an argument:');
  console.error('   node seed.js your@email.com');
  process.exit(1);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function randBetween(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function dateOf(year, month, day) {
  return new Date(year, month, day, randBetween(8, 22), randBetween(0, 59));
}

// ─── Monthly expense templates ───────────────────────────────────────────────
// Each entry: { category, type, minAmt, maxAmt, daysOfMonth (approx), note }

const RECURRING = [
  { category: 'Housing',      type: 'expense', min: 18000, max: 18000, day: 1,  note: 'Monthly Rent' },
  { category: 'Utilities',    type: 'expense', min: 1200,  max: 1800,  day: 5,  note: 'Electricity Bill' },
  { category: 'Utilities',    type: 'expense', min: 299,   max: 499,   day: 6,  note: 'Internet / Broadband' },
  { category: 'Utilities',    type: 'expense', min: 149,   max: 299,   day: 7,  note: 'OTT Subscriptions' },
  { category: 'Savings',      type: 'expense', min: 5000,  max: 5000,  day: 3,  note: 'Monthly SIP / Savings' },
];

// Random food entries per month
const FOOD_NOTES = [
  'Zomato', 'Swiggy', 'Office lunch', 'Cafe Coffee Day', 'Groceries - DMart',
  'Weekend brunch', 'Biryani Point', 'McDonald\'s', 'Subway', 'Local restaurant',
  'Fruit & Vegetables', 'Monthly groceries', 'Pizza night', 'Chai & snacks',
];

// Transport
const TRANSPORT_NOTES = [
  'Ola cab', 'Uber', 'Metro card recharge', 'Petrol fill-up', 'Auto rickshaw',
  'Bus pass', 'Rapido', 'Weekend drive fuel',
];

// Entertainment
const ENT_NOTES = [
  'BookMyShow movie', 'Gaming top-up', 'Amazon Prime', 'Spotify Premium',
  'Weekend gateway', 'Cricket match tickets', 'Netflix subscription', 'Indoor games',
];

// Shopping
const SHOP_NOTES = [
  'Amazon shopping', 'Myntra clothing', 'Nykaa', 'Decathlon sportswear',
  'Books - Flipkart', 'Electronics accessory', 'Lifestyle store', 'Weekend mall',
];

// Health
const HEALTH_NOTES = [
  'Pharmacy', 'Doctor consultation', 'Apollo diagnostics', 'Gym membership',
  'Yoga class', 'Health supplement', 'Eye checkup',
];

// Education
const EDU_NOTES = [
  'Udemy course', 'Coursera subscription', 'Tech book', 'O\'Reilly membership',
  'Conference ticket', 'AWS certification prep',
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildMonthExpenses(userId, year, month) {
  const records = [];

  // 1. Recurring fixed items
  for (const r of RECURRING) {
    records.push({
      userId,
      amount: randBetween(r.min, r.max),
      type: r.type,
      category: r.category,
      note: r.note,
      isRecurring: true,
      date: dateOf(year, month, r.day),
    });
  }

  // 2. Food — 10–16 entries
  const foodCount = Math.floor(randBetween(10, 16));
  for (let i = 0; i < foodCount; i++) {
    records.push({
      userId,
      amount: randBetween(80, 900),
      type: 'expense',
      category: 'Food & Dining',
      note: pickRandom(FOOD_NOTES),
      isRecurring: false,
      date: dateOf(year, month, Math.floor(randBetween(1, 28))),
    });
  }

  // 3. Transport — 6–10 entries
  const transCount = Math.floor(randBetween(6, 10));
  for (let i = 0; i < transCount; i++) {
    records.push({
      userId,
      amount: randBetween(50, 800),
      type: 'expense',
      category: 'Transport',
      note: pickRandom(TRANSPORT_NOTES),
      isRecurring: false,
      date: dateOf(year, month, Math.floor(randBetween(1, 28))),
    });
  }

  // 4. Entertainment — 2–5 entries
  const entCount = Math.floor(randBetween(2, 5));
  for (let i = 0; i < entCount; i++) {
    records.push({
      userId,
      amount: randBetween(149, 2000),
      type: 'expense',
      category: 'Entertainment',
      note: pickRandom(ENT_NOTES),
      isRecurring: false,
      date: dateOf(year, month, Math.floor(randBetween(1, 28))),
    });
  }

  // 5. Shopping — 1–4 entries
  const shopCount = Math.floor(randBetween(1, 4));
  for (let i = 0; i < shopCount; i++) {
    records.push({
      userId,
      amount: randBetween(299, 5000),
      type: 'expense',
      category: 'Shopping',
      note: pickRandom(SHOP_NOTES),
      isRecurring: false,
      date: dateOf(year, month, Math.floor(randBetween(1, 28))),
    });
  }

  // 6. Health — 0–2 entries (not every month)
  if (Math.random() > 0.4) {
    const healthCount = Math.floor(randBetween(1, 2));
    for (let i = 0; i < healthCount; i++) {
      records.push({
        userId,
        amount: randBetween(200, 2500),
        type: 'expense',
        category: 'Health',
        note: pickRandom(HEALTH_NOTES),
        isRecurring: false,
        date: dateOf(year, month, Math.floor(randBetween(1, 28))),
      });
    }
  }

  // 7. Education — 0–1 entries (occasional)
  if (Math.random() > 0.65) {
    records.push({
      userId,
      amount: randBetween(499, 3999),
      type: 'expense',
      category: 'Education',
      note: pickRandom(EDU_NOTES),
      isRecurring: false,
      date: dateOf(year, month, Math.floor(randBetween(1, 25))),
    });
  }

  // 8. Income — Salary on 1st
  records.push({
    userId,
    amount: 95000,
    type: 'income',
    category: 'Salary',
    note: 'Monthly Salary Credit',
    isRecurring: true,
    date: dateOf(year, month, 1),
  });

  // 9. Bonus — occasional (March, Sept)
  if (month === 2 || month === 8) {
    records.push({
      userId,
      amount: randBetween(20000, 50000),
      type: 'income',
      category: 'Bonus',
      note: month === 2 ? 'Annual Performance Bonus' : 'Mid-Year Bonus',
      isRecurring: false,
      date: dateOf(year, month, 15),
    });
  }

  return records;
}

// ─── Month range: Jan 2025 → Mar 2026 ────────────────────────────────────────

const MONTHS_TO_SEED = [];
for (let m = 0; m <= 11; m++) MONTHS_TO_SEED.push({ year: 2025, month: m }); // Jan–Dec 2025
for (let m = 0; m <= 2; m++)  MONTHS_TO_SEED.push({ year: 2026, month: m }); // Jan–Mar 2026

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const user = await User.findOne({ email: userEmail.toLowerCase() });
  if (!user) {
    console.error(`❌ No user found with email: ${userEmail}`);
    process.exit(1);
  }
  console.log(`👤 Seeding data for user: ${user.name} (${user.email})`);

  // Update user income settings
  await User.findByIdAndUpdate(user._id, {
    yearlyIncome: 1140000, // ₹95,000/month × 12
    monthlyBudget: 80000,
  });
  console.log('💰 Updated yearly income to ₹11,40,000 and monthly budget to ₹80,000');

  let totalInserted = 0;

  for (const { year, month } of MONTHS_TO_SEED) {
    const monthName = new Date(year, month, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    const records = buildMonthExpenses(user._id, year, month);
    await Expense.insertMany(records);
    totalInserted += records.length;
    console.log(`  📅 ${monthName} — inserted ${records.length} records`);
  }

  console.log(`\n✅ Done! Inserted ${totalInserted} total records across ${MONTHS_TO_SEED.length} months.`);
  console.log('🔄 Refresh your SpendSmart dashboard to see the data.');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Seed error:', err.message);
  process.exit(1);
});
