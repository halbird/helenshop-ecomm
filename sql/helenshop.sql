-- CREATE TABLE users (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   fname VARCHAR(100) NOT NULL,
--   lname VARCHAR(100) NOT NULL,
--   email VARCHAR(200) UNIQUE NOT NULL,
--   password VARCHAR(255) NOT NULL,
--   salt VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP DEFAULT NOW()
-- );

-- CREATE TABLE products (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   title VARCHAR(200) NOT NULL,
--   price DECIMAL(8,2) NOT NULL,
--   img TEXT,
--   inventory INT,
--   created_by INT NOT NULL,
--   created_at TIMESTAMP DEFAULT NOW(),
--   FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE CASCADE
-- );

-- CREATE TABLE carts (
--   user_id INT,
--   session_id VARCHAR(40) NOT NULL,
--   product_id INT NOT NULL,
--   quantity INT NOT NULL,
--   created_at TIMESTAMP DEFAULT NOW(),
--   FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
--   FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
--   CONSTRAINT UNIQUE INDEX index_carts_sessions (session_id, product_id),
--   CONSTRAINT UNIQUE INDEX index_carts_users (user_id, product_id)
-- );


-- -- Trigger to keep track of deleted accounts

-- CREATE TABLE deleted_accounts (
--   id INT NOT NULL,
--   fname VARCHAR(100) NOT NULL,
--   lname VARCHAR(100) NOT NULL,
--   email VARCHAR(200) NOT NULL,
--   created_at TIMESTAMP DEFAULT NOW()
-- );

-- DELIMITER $$

-- CREATE TRIGGER capture_deleted_accounts
--   AFTER DELETE ON users FOR EACH ROW
--   BEGIN
--     INSERT INTO deleted_accounts(id, fname, lname, email) VALUES (OLD.id, OLD.fname, OLD.lname, OLD.email);
--   END$$

-- DELIMITER ;