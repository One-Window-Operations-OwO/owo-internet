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
    const connection = await pool.getConnection();
    try {
        await connection.query(createTableQuery);
        console.log("Cluster table created or already exists.");
    } finally {
        connection.release();
    }
}

export async function seedClusters() {
    const data = [
        ['BAPP', '(1A) Simpulan BAPP belum diparaf', 'Tidak Ada Paraf'],
        ['BAPP', '(1B) Ceklis BAPP tidak lengkap', 'Ceklis tidak lengkap'],
        ['BAPP', '(1C) Tidak ada tanda tangan dari Pihak Sekolah atau Pihak Kedua', 'TTD Tidak Ada'],
        ['BAPP', '(1D) Data penandatangan pada hal 1 dan hal 2 BAPP tidak konsisten', 'Tidak Konsisten'],
        ['BAPP', '(1E) Double ceklis', 'Double ceklis'],
        ['BAPP', '(1F) Data BAPP sekolah tidak sesuai (cek NPSN pada tabel pertama dan NPSN dengan foto sekolah atau NPSN yang diinput)', 'Data BAPP sekolah tidak sesuai'],
        ['BAPP', '(1G) BAPP tidak terlihat jelas', 'BAPP Tidak Terlihat Jelas'],
        ['BAPP', '(1H) Data pihak kesatu (sekolah) dan kedua tidak lengkap', 'Data pihak kesatu (sekolah) dan kedua tidak lengkap'],
        ['BAPP', '(1I) Stempel pada BAPP tidak sesuai dengan sekolahnya', 'Tidak Sesuai'],
        ['BAPP', '(1J) Stempel Tidak Ada', 'Tidak ada'],
        ['BAPP', '(1K) BAPP tidak boleh diedit digital', 'Diedit'],
        ['BAPP', '(1L) BAPP tidak ada', 'Tidak ada BAPP'],
        ['BAPP', '(1M) Tanggal pada BAPP tidak konsisten', 'Tanggal Tidak Konsisten'],
        ['BAPP', '(1N) Tanggal BAPP tidak ada', 'Tanggal Tidak Ada'],
        ['BAPP', '(1O) Stempel tidak terlihat jelas', 'Tidak terlihat jelas'],
        ['BAPP', '(1R) Tidak ada nama terang pada bagian tanda tangan', 'Tidak ada nama terang pada bagian tanda tangan'],
        ['BAPP', '(1S) Ceklis BAPP "Tidak Sesuai/Rusak/Perlu Pergantian/Belum Dapat Diterima"', 'Tidak Sesuai/Rusak/Perlu Pergantian/Belum Dapat Diterima'],
        ['BAPP', '(1T) BAPP terpotong', 'BAPP terpotong'],
        ['BAPP', '(1U) Pihak pertama hanya boleh dari kepala sekolah/wakil kepala sekolah/guru/pengajar/operator sekolah', 'Pihak pertama bukan dari tenaga pendidik'],
        ['Kelengkapan Internet Satelit', '(2A) Foto kelengkapan tidak ada', 'Tidak ada'],
        ['Kelengkapan Internet Satelit', '(2B) Foto kelengkapan tidak sesuai', 'Tidak sesuai'],
        ['Serial Number Kardus', '(3A) Foto serial number pada kardus tidak jelas', 'Tidak terlihat jelas'],
        ['Serial Number Kardus', '(3B) Foto serial number pada kardus tidak sesuai dengan SN web', 'Tidak sesuai dengan SN Web'],
        ['Serial Number Kardus', '(3C) Foto Serial Number pada kardus tidak ada', 'Tidak ada'],
        ['Foto Sekolah', '(4A) Foto sekolah tidak sesuai', 'Tidak sesuai'],
        ['Foto Sekolah', '(4B) Foto sekolah tidak ada', 'Tidak ada'],
        ['Foto Sekolah', '(4C) Foto sekolah tidak terlihat jelas', 'Tidak terlihat jelas'],
        ['Geo Tagging', '(5A) Geo Tagging tidak sesuai', 'Tidak sesuai'],
        ['Geo Tagging', '(5B) Geo Tagging tidak ada', 'Tidak ada'],
        ['Geo Tagging', '(5C) Geo Tagging tidak terlihat jelas', 'Tidak terlihat jelas'],
        ['Perangkat Terhubung Internet', '(6A) Dokumentasi perangkat terhubung tidak sesuai', 'Tidak Sesuai'],
        ['Perangkat Terhubung Internet', '(6B) Dokumentasi perangkat terhubung tidak ada', 'Tidak ada'],
        ['Perangkat Terhubung Internet', '(6C) Dokumentasi perangkat terhubung tidak terlihat jelas', 'Tidak terlihat jelas'],
        ['Serial Number BAPP', '(7A) SN pada BAPP tidak jelas', 'Tidak terlihat jelas'],
        ['Serial Number BAPP', '(7B) SN pada BAPP tidak sesuai dengan SN web', 'Tidak sesuai dengan SN Web'],
        ['Serial Number BAPP', '(7C) SN pada BAPP tidak ada', 'Tidak ada'],
        ['Foto Box dan PIC', '(8A) Foto Box dan PIC tidak ada', 'Tidak ada']
    ];

    const connection = await pool.getConnection();
    try {
        await createSubClusterTable();

        // Check if data already exists to avoid duplication
        const [rows] = await connection.query("SELECT COUNT(*) as count FROM cluster");
        const count = (rows as any)[0]?.count;
        if (count > 0) {
            console.log("Cluster table already has data. Skipping seed.");
            return;
        }

        console.log("Seeding cluster table...");
        for (const [main, sub, option] of data) {
            await connection.query(
                "INSERT INTO cluster (main_cluster, sub_cluster, nama_opsi) VALUES (?, ?, ?)",
                [main, sub, option]
            );
        }
        console.log("Cluster table seeded successfully.");
    } catch (error) {
        console.error("Error seeding clusters:", error);
    } finally {
        connection.release();
    }
}

export async function getAllClusters() {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query("SELECT * FROM cluster ORDER BY main_cluster, id");
        return rows;
    } finally {
        connection.release();
    }
}
