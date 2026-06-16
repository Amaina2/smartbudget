-- SmartBudget — PostgreSQL schema

CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  category_id SERIAL PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL,
  keywords TEXT,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT TRUE
);

CREATE TABLE transactions (
  transaction_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  description VARCHAR(500),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category_id INTEGER REFERENCES categories(category_id),
  recurring_id INTEGER,
  transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE budgets (
  budget_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(category_id),
  amount_limit DECIMAL(12, 2) NOT NULL,
  period_type VARCHAR(10) NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  alert_80_sent BOOLEAN DEFAULT FALSE,
  alert_90_sent BOOLEAN DEFAULT FALSE,
  alert_100_sent BOOLEAN DEFAULT FALSE
);

CREATE TABLE correction_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  description TEXT,
  corrected_category_id INTEGER REFERENCES categories(category_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recurring_transactions (
  recurring_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  description VARCHAR(500) NOT NULL,
  category_id INTEGER REFERENCES categories(category_id),
  transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  frequency VARCHAR(10) NOT NULL CHECK (frequency IN ('weekly', 'monthly')),
  next_due_date DATE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE transactions
  ADD CONSTRAINT fk_transactions_recurring
  FOREIGN KEY (recurring_id) REFERENCES recurring_transactions(recurring_id) ON DELETE SET NULL;

CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX idx_transactions_user_type ON transactions(user_id, transaction_type);
CREATE INDEX idx_budgets_user ON budgets(user_id);
CREATE INDEX idx_recurring_user_active_due ON recurring_transactions(user_id, active, next_due_date);

-- Seed default categories (global: user_id NULL)
INSERT INTO categories (category_name, keywords, user_id, is_default) VALUES
  ('Food', 'restaurant,uber eats,glovo,kfc,food,lunch,breakfast', NULL, TRUE),
  ('Transport', 'uber,bolt,matatu,fuel,taxi,bus', NULL, TRUE),
  ('Utilities', 'airtime,tokens,electricity,water,wifi,data', NULL, TRUE),
  ('Entertainment', 'netflix,showmax,spotify,movie,game', NULL, TRUE),
  ('Education', 'tuition,books,course,usiu', NULL, TRUE),
  ('Miscellaneous', 'mpesa,general,other', NULL, TRUE);
