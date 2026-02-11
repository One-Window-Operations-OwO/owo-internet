import pool from '../db';

// Mapping from main_cluster name to logs table column name
export const CLUSTER_COLUMN_MAP: Record<string, string> = {
    'Geo Tagging': 'geo_tagging',
    'Foto Sekolah': 'foto_sekolah',
    'Foto Box dan PIC': 'foto_box_dan_pic',
    'Kelengkapan Internet Satelit': 'kelengkapan_unit',
    'Serial Number Kardus': 'foto_serial_number_kardus',
    'Serial Number BAPP': 'serial_number_bapp',
    'Perangkat Terhubung Internet': 'perangkat_terhubung_internet',
    'BAPP': 'bapp',
};

export async function createLogsTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            cutoff_id INT NOT NULL,
            serial_number VARCHAR(255) NOT NULL,
            geo_tagging INT NULL,
            foto_sekolah INT NULL,
            foto_box_dan_pic INT NULL,
            kelengkapan_unit INT NULL,
            foto_serial_number_kardus INT NULL,
            serial_number_bapp INT NULL,
            perangkat_terhubung_internet INT NULL,
            bapp INT NULL,
            user_id INT NOT NULL,
            status ENUM('REJECTED', 'VERIFIED') NOT NULL,
            
            FOREIGN KEY (cutoff_id) REFERENCES cutoff(id) ON DELETE CASCADE,
            FOREIGN KEY (geo_tagging) REFERENCES cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (foto_sekolah) REFERENCES cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (foto_box_dan_pic) REFERENCES cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (kelengkapan_unit) REFERENCES cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (foto_serial_number_kardus) REFERENCES cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (serial_number_bapp) REFERENCES cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (perangkat_terhubung_internet) REFERENCES cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (bapp) REFERENCES cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `;
    const conn = await pool.getConnection();
    try {
        await conn.query(createTableQuery);

        // Migration: Check if status column exists, if not add it
        const [columns]: any = await conn.query("SHOW COLUMNS FROM logs LIKE 'status'");
        if (columns.length === 0) {
            await conn.query("ALTER TABLE logs ADD COLUMN status ENUM('REJECTED', 'VERIFIED') DEFAULT NULL");
        }
    } finally {
        conn.release();
    }
}

export interface ClusterValues {
    geo_tagging?: number | null;
    foto_sekolah?: number | null;
    foto_box_dan_pic?: number | null;
    kelengkapan_unit?: number | null;
    foto_serial_number_kardus?: number | null;
    serial_number_bapp?: number | null;
    perangkat_terhubung_internet?: number | null;
    bapp?: number | null;
}

export async function insertLog(
    cutoffId: number,
    serialNumber: string,
    userId: number,
    clusterValues?: ClusterValues
) {
    const conn = await pool.getConnection();
    try {
        const [existing]: any = await conn.query('SELECT id FROM logs WHERE cutoff_id = ?', [cutoffId]);

        if (existing.length > 0) {
            return existing[0].id;
        }

        // Determine status based on whether any cluster has a non-null value
        const cv = clusterValues || {};
        const hasRejection = Object.values(cv).some(v => v !== null && v !== undefined);
        const status = hasRejection ? 'REJECTED' : 'VERIFIED';

        const [result]: any = await conn.query(
            `INSERT INTO logs (
                cutoff_id, serial_number, user_id, status,
                geo_tagging, foto_sekolah, foto_box_dan_pic,
                kelengkapan_unit, foto_serial_number_kardus,
                serial_number_bapp, perangkat_terhubung_internet, bapp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                cutoffId,
                serialNumber,
                userId,
                status,
                cv.geo_tagging ?? null,
                cv.foto_sekolah ?? null,
                cv.foto_box_dan_pic ?? null,
                cv.kelengkapan_unit ?? null,
                cv.foto_serial_number_kardus ?? null,
                cv.serial_number_bapp ?? null,
                cv.perangkat_terhubung_internet ?? null,
                cv.bapp ?? null,
            ]
        );
        return result.insertId;
    } finally {
        conn.release();
    }
}
