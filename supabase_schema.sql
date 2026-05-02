-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  "monthlyBudget" NUMERIC DEFAULT 0,
  "yearlyIncome" NUMERIC DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create expenses table
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL DEFAULT 'expense',
  category TEXT NOT NULL,
  note TEXT DEFAULT '',
  "isRecurring" BOOLEAN DEFAULT FALSE,
  date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX expenses_userId_date_idx ON expenses ("userId", date DESC);

-- Create loans table
CREATE TABLE loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  "partyName" TEXT NOT NULL,
  "principalAmount" NUMERIC NOT NULL,
  "interestRate" NUMERIC NOT NULL,
  "durationMonths" INTEGER NOT NULL,
  "startDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "paymentDay" INTEGER NOT NULL,
  status TEXT DEFAULT 'Active',
  "monthlyEMI" NUMERIC NOT NULL,
  "totalAmount" NUMERIC NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create credit_cards table
CREATE TABLE credit_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "cardName" TEXT NOT NULL,
  "lastFourDigits" TEXT DEFAULT '0000',
  "creditLimit" NUMERIC NOT NULL,
  "billingDate" INTEGER NOT NULL,
  "currentBalance" NUMERIC DEFAULT 0,
  color TEXT DEFAULT '#8b5cf6',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create credit_card_transactions table
CREATE TABLE credit_card_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "creditCardId" UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT DEFAULT 'charge',
  category TEXT DEFAULT 'Other',
  note TEXT DEFAULT '',
  date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
