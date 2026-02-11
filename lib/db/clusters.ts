import pool from '../db';

export async function createSubClusterTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS cluster (
            id INT AUTO_INCREMENT PRIMARY KEY,
            main_cluster VARCHAR(255) NOT NULL,
            sub_cluster VARCHAR(255) NOT NULL,
            nama_opsi VARCHAR(255) NOT NULL
        );
    `;
    const conn = await pool.getConnection();
    try {
        await conn.query(createTableQuery);
    } finally {
        conn.release();
    }
}
