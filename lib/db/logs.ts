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
    'Skylink Web': 'skylink_web',
    'NPSN BAPP': 'npsn_bapp'
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
            skylink_web INT NULL,
            npsn_bapp INT NULL,
            denda INT NULL,
            user_id INT NULL,
            status ENUM('REJECTED', 'VERIFIED','SENDING') NOT NULL,
            tanggal_bapp DATE NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (cutoff_id) REFERENCES cutoff(id) ON DELETE CASCADE,
            FOREIGN KEY (geo_tagging) REFERENCES cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (foto_sekolah) REFERENCES cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (foto_box_dan_pic) REFERENCES cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (kelengkapan_unit) REFERENCES cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (foto_serial_number_kardus) REFERENCES cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (serial_number_bapp) REFERENCES cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (perangkat_terhubung_internet) REFERENCES cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (bapp) REFERENCES cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (skylink_web) REFERENCES cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (npsn_bapp) REFERENCES cluster(id) ON DELETE SET NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
    `;
    const dropTriggerQuery = `DROP TRIGGER IF EXISTS trg_hitung_denda_insert;`;

    const createTriggerQuery = `
        CREATE TRIGGER trg_hitung_denda_insert
        BEFORE INSERT ON logs
        FOR EACH ROW
        BEGIN
            DECLARE selisih_hari INT;
            
            IF NEW.status = 'VERIFIED' AND NEW.tanggal_bapp IS NOT NULL THEN
                SET selisih_hari = DATEDIFF(NEW.tanggal_bapp, '2026-01-24');
                
                IF selisih_hari > 0 THEN
                    SET NEW.denda = CEIL((1 / 1000) * selisih_hari * 9324);
                ELSE
                    SET NEW.denda = 0;
                END IF;
            END IF;
        END;
    `;
    const conn = await pool.getConnection();
    try {
        await conn.query(createTableQuery);

        // Migration: Check if status column exists, if not add it
        const [columns]: any = await conn.query("SHOW COLUMNS FROM logs LIKE 'status'");
        if (columns.length === 0) {
            await conn.query("ALTER TABLE logs ADD COLUMN status ENUM('REJECTED', 'VERIFIED','SENDING') DEFAULT NULL");
        }

        // Migration: Check if tanggal_bapp column exists
        const [tbCols]: any = await conn.query("SHOW COLUMNS FROM logs LIKE 'tanggal_bapp'");
        if (tbCols.length === 0) {
            await conn.query("ALTER TABLE logs ADD COLUMN tanggal_bapp DATE NULL");
        }

        // Migration: Check if user_id is nullable (optional: can drop fk and alter here but typically handled manually or via dedicated migration script)

        // Migration: Check if created_at column exists
        const [caCols]: any = await conn.query("SHOW COLUMNS FROM logs LIKE 'created_at'");
        if (caCols.length === 0) {
            await conn.query("ALTER TABLE logs ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
        }
        await conn.query(dropTriggerQuery);
        await conn.query(createTriggerQuery);
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
    skylink_web?: number | null;
    npsn_bapp?: number | null;
}

export async function insertLog(
    cutoffId: number,
    serialNumber: string,
    userId: number | null,
    clusterValues?: ClusterValues,
    tanggalBapp?: string,
    defaultStatus?: string
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
        const status = defaultStatus || (hasRejection ? 'REJECTED' : 'VERIFIED');

        const [result]: any = await conn.query(
            `INSERT INTO logs (
                cutoff_id, serial_number, user_id, status,
                geo_tagging, foto_sekolah, foto_box_dan_pic,
                kelengkapan_unit, foto_serial_number_kardus,
                serial_number_bapp, perangkat_terhubung_internet, bapp,
                skylink_web, npsn_bapp, tanggal_bapp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                cv.skylink_web ?? null,
                cv.npsn_bapp ?? null,
                tanggalBapp ?? null,
            ]
        );
        return result.insertId;
    } finally {
        conn.release();
    }
}

export async function updateLogStatus(logId: number, status: string) {
    const conn = await pool.getConnection();
    try {
        await conn.query('UPDATE logs SET status = ? WHERE id = ?', [status, logId]);
    } finally {
        conn.release();
    }
}

export interface RejectionSubCluster {
    sub_cluster: string;
    count: number;
}

export interface RejectionMainCluster {
    main_cluster: string;
    total: number;
    sub_clusters: RejectionSubCluster[];
}

/**
 * Counts rejections grouped by main_cluster and sub_cluster.
 * Each of the 10 cluster FK columns in the logs table is UNIONed together,
 * then joined with the cluster table to get human-readable names.
 */
export async function getRejectionStats(): Promise<RejectionMainCluster[]> {
    const conn = await pool.getConnection();
    try {
        const query = `
            SELECT c.main_cluster, c.sub_cluster, COUNT(*) as count
            FROM (
                SELECT geo_tagging          AS cluster_id FROM logs WHERE status = 'REJECTED' AND geo_tagging IS NOT NULL
                UNION ALL
                SELECT foto_sekolah          AS cluster_id FROM logs WHERE status = 'REJECTED' AND foto_sekolah IS NOT NULL
                UNION ALL
                SELECT foto_box_dan_pic      AS cluster_id FROM logs WHERE status = 'REJECTED' AND foto_box_dan_pic IS NOT NULL
                UNION ALL
                SELECT kelengkapan_unit      AS cluster_id FROM logs WHERE status = 'REJECTED' AND kelengkapan_unit IS NOT NULL
                UNION ALL
                SELECT foto_serial_number_kardus AS cluster_id FROM logs WHERE status = 'REJECTED' AND foto_serial_number_kardus IS NOT NULL
                UNION ALL
                SELECT serial_number_bapp    AS cluster_id FROM logs WHERE status = 'REJECTED' AND serial_number_bapp IS NOT NULL
                UNION ALL
                SELECT perangkat_terhubung_internet AS cluster_id FROM logs WHERE status = 'REJECTED' AND perangkat_terhubung_internet IS NOT NULL
                UNION ALL
                SELECT bapp                  AS cluster_id FROM logs WHERE status = 'REJECTED' AND bapp IS NOT NULL
                UNION ALL
                SELECT skylink_web           AS cluster_id FROM logs WHERE status = 'REJECTED' AND skylink_web IS NOT NULL
                UNION ALL
                SELECT npsn_bapp             AS cluster_id FROM logs WHERE status = 'REJECTED' AND npsn_bapp IS NOT NULL
            ) AS all_rejections
            JOIN cluster c ON c.id = all_rejections.cluster_id
            GROUP BY c.main_cluster, c.sub_cluster
            ORDER BY c.main_cluster, count DESC
        `;
        const [rows]: any = await conn.query(query);

        // Group flat rows into nested structure
        const map = new Map<string, RejectionMainCluster>();
        for (const row of rows) {
            if (!map.has(row.main_cluster)) {
                map.set(row.main_cluster, { main_cluster: row.main_cluster, total: 0, sub_clusters: [] });
            }
            const entry = map.get(row.main_cluster)!;
            entry.total += Number(row.count);
            entry.sub_clusters.push({ sub_cluster: row.sub_cluster, count: Number(row.count) });
        }

        // Sort by total desc
        return Array.from(map.values()).sort((a, b) => b.total - a.total);
    } finally {
        conn.release();
    }
}
