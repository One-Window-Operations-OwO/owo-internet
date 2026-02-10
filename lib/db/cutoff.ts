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

export async function insertCutoffData(data: any[]) {
    // data is an array of [school_name, npsn, resi_number, bapp_number, starlink_id, received_date, user_id]
    if (data.length === 0) return;

    const query = `
        INSERT INTO cutoff (school_name, npsn, resi_number, bapp_number, starlink_id, received_date, user_id)
        VALUES ?
    `;

    const conn = await pool.getConnection();
    try {
        await conn.query(query, [data]);
    } finally {
        conn.release();
    }
}
