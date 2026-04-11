-- Optional: migrate legacy default (10%) to the platform default (3%).
-- Adjust the WHERE clause if you use custom commission rates per vendor.

UPDATE vendors
SET commission_rate = 3.00
WHERE commission_rate = 10.00;
