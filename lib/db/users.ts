import pool from '../db';

// Membuat tabel accounts jika belum ada
export async function createUserTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255),
            role VARCHAR(50) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    const conn = await pool.getConnection();
    try {
        await conn.query(createTableQuery);
    } finally {
        conn.release();
    }
}

export async function createUserIfNotExists(email: string, name: string) {
    const query = `
        INSERT INTO users (email, name, role) 
        VALUES (?, ?, 'user') 
        ON DUPLICATE KEY UPDATE name = VALUES(name);
    `;
    const conn = await pool.getConnection();
    try {
        await conn.query(query, [email, name]);
    } finally {
        conn.release();
    }
}