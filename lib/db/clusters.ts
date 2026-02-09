import pool from '../db';

export async function createSubClusterTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sub_cluster (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nama_sub_cluster VARCHAR(255) NOT NULL
        );
    `;
    const conn = await pool.getConnection();
    try {
        await conn.query(createTableQuery);
    } finally {
        conn.release();
    }
}
