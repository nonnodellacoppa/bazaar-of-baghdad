-- Tabella utenti
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE,
    balance REAL DEFAULT 0
);

-- Tabella carte in vendita
CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    set_name TEXT,
    condition TEXT,
    price REAL NOT NULL,
    description TEXT,
    image_url TEXT, 
    status TEXT DEFAULT 'available',
    FOREIGN KEY (seller_id) REFERENCES users(id)
);

-- Tabella transazioni (storico acquisti)
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buyer_id INTEGER NOT NULL,
    card_id INTEGER NOT NULL,
    price REAL NOT NULL,
    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (card_id) REFERENCES cards(id)
);
