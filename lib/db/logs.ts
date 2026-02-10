import pool from '../db';

export async function createLogsTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            cutoff_id INT,
            bapp INT NULL,
            kelengkapan_internet_satelit INT NULL,
            serial_number_kardus VARCHAR(255) NULL,
            foto_sekolah INT NULL,
            geo_tagging INT NULL,
            perangkat_terhubung_internet INT NULL,
            serial_number_bapp INT NULL,
            foto_box_dan_pic INT NULL,
            user_id INT NULL,
            
            FOREIGN KEY (cutoff_id) REFERENCES cutoff(id) ON DELETE CASCADE,
            FOREIGN KEY (bapp) REFERENCES sub_cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (kelengkapan_internet_satelit) REFERENCES sub_cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (serial_number_kardus) REFERENCES sub_cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (foto_sekolah) REFERENCES sub_cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (geo_tagging) REFERENCES sub_cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (perangkat_terhubung_internet) REFERENCES sub_cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (serial_number_bapp) REFERENCES sub_cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (foto_box_dan_pic) REFERENCES sub_cluster(id) ON DELETE SET NULL,
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
