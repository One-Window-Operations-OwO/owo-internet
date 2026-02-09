import pool from '../db';

export async function createCutoffTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS cutoff (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_name VARCHAR(255),
            npsn VARCHAR(50),
            resi_number VARCHAR(100),
            bapp_number VARCHAR(100),
            starlink_id VARCHAR(100),
            received_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            user_id INT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `;
    const conn = await pool.getConnection();
    try {
        await conn.query(createTableQuery);
    } finally {
        conn.release();
    }
}
