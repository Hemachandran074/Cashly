-- Seed System Categories for Cashly
INSERT INTO categories (name, icon, kind, is_system) VALUES
  ('Food & Dining', 'utensils', 'EXPENSE', TRUE),
  ('Groceries', 'shopping-cart', 'EXPENSE', TRUE),
  ('Transport', 'car', 'EXPENSE', TRUE),
  ('Shopping', 'shopping-bag', 'EXPENSE', TRUE),
  ('Bills & Utilities', 'file-text', 'EXPENSE', TRUE),
  ('Health & Medical', 'heart-pulse', 'EXPENSE', TRUE),
  ('Entertainment', 'film', 'EXPENSE', TRUE),
  ('Rent & Housing', 'home', 'EXPENSE', TRUE),
  ('Education', 'book-open', 'EXPENSE', TRUE),
  ('Travel', 'plane', 'EXPENSE', TRUE),
  ('Salary', 'briefcase', 'INCOME', TRUE),
  ('Repayment', 'arrow-left-right', 'INCOME', TRUE),
  ('Investments', 'trending-up', 'INCOME', TRUE),
  ('Other Expense', 'tag', 'EXPENSE', TRUE),
  ('Other Income', 'plus-circle', 'INCOME', TRUE)
ON CONFLICT DO NOTHING;

