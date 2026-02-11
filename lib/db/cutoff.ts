import pool from '../db';

export async function createCutoffTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS cutoff (
            id INT AUTO_INCREMENT PRIMARY KEY,
            shipment_id int,
            school_name VARCHAR(255),
            npsn VARCHAR(50),
            resi_number VARCHAR(100),
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
    // data is an array of [shipment_id, school_name, npsn, resi_number, starlink_id, received_date, user_id]
    if (data.length === 0) return;

    const query = `
        INSERT INTO cutoff (shipment_id, school_name, npsn, resi_number, starlink_id, received_date, user_id)
        VALUES ?
    `;

    const conn = await pool.getConnection();
    try {
        await conn.query(query, [data]);
    } finally {
        conn.release();
    }
}
export async function checkExistingResiNumbers(resiNumbers: string[]) {
    if (resiNumbers.length === 0) return [];

    const conn = await pool.getConnection();
    try {
        const query = `
            SELECT c.resi_number 
            FROM cutoff c
            LEFT JOIN logs l ON c.id = l.cutoff_id
            WHERE c.resi_number IN (?)
            AND (l.status = 'VERIFIED' OR l.status IS NULL)
        `;
        const [rows]: any = await conn.query(query, [resiNumbers]);
        return rows.map((row: any) => row.resi_number);
    } finally {
        conn.release();
    }
}

export async function getCutoffDataByUser(userId: string, limit: number, offset: number) {
    const conn = await pool.getConnection();
    try {
        // Get total count
        const [countRows]: any = await conn.query(
            'SELECT COUNT(*) as total FROM cutoff WHERE user_id = ?',
            [userId]
        );
        const total = countRows[0].total;

        // Get paginated data
        const [rows] = await conn.query(
            `SELECT cutoff.*, logs.status as verification_status 
             FROM cutoff 
             LEFT JOIN logs ON logs.cutoff_id = cutoff.id
             WHERE cutoff.user_id = ? 
             ORDER BY cutoff.created_at DESC 
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        return {
            data: rows,
            total
        };
    } finally {
        conn.release();
    }
}

export async function getUnloggedCutoffByUser(userId: string) {
    const conn = await pool.getConnection();
    try {
        const query = `
            SELECT c.* 
            FROM cutoff c
            LEFT JOIN logs l ON c.id = l.cutoff_id
            WHERE c.user_id = ? 
            AND l.id IS NULL
        `;
        const [rows] = await conn.query(query, [userId]);
        return rows;
    } finally {
        conn.release();
    }
}

export async function createCutoffHistoryLogTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS cutoff_history_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            total_new_items INT NOT NULL,
            users_count INT NOT NULL,
            base_per_user INT NOT NULL,
            remainder INT NOT NULL,
            skipped_count INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            executed_by INT NULL,
            details JSON NULL,
            FOREIGN KEY (executed_by) REFERENCES users(id) ON DELETE SET NULL
        );
    `;
    const conn = await pool.getConnection();
    try {
        await conn.query(createTableQuery);
    } finally {
        conn.release();
    }
}

export async function insertCutoffHistoryLog(data: {
    total_new_items: number;
    users_count: number;
    base_per_user: number;
    remainder: number;
    skipped_count: number;
    executed_by?: number;
    details?: any;
}) {
    const query = `
        INSERT INTO cutoff_history_log 
        (total_new_items, users_count, base_per_user, remainder, skipped_count, executed_by, details)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const conn = await pool.getConnection();
    try {
        await conn.query(query, [
            data.total_new_items,
            data.users_count,
            data.base_per_user,
            data.remainder,
            data.skipped_count,
            data.executed_by || null,
            data.details ? JSON.stringify(data.details) : null
        ]);
    } finally {
        conn.release();
    }
}
