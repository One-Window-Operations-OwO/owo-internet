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

const userList = [
    { username: "kalicasd23", password: "serlinda23" },
    { username: "muhammadsd13", password: "muhammad13" },
    { username: "marvinsd17", password: "nugraha17" },
    { username: "dzakysd09", password: "fauzan09" },
    { username: "rifatsd15", password: "hambali15" },
    { username: "faisalsd21", password: "rahman21" },
    { username: "rifkasd24", password: "adzanti24" },
    { username: "alisd27", password: "fatonah27" },
    { username: "sulthansd18", password: "zackysd18" },
    { username: "mulkansd22", password: "adziima22" },
    { username: "najmasd10", password: "mahesa10" },
    { username: "aqsasd11", password: "zamzami11" },
    { username: "josesd12", password: "limbor12" },
    { username: "xeylasd14", password: "arfhina14" },
    { username: "yasmeensd16", password: "almira16" },
    { username: "ikhsansd19", password: "ikhsandewo19" },
    { username: "rizkysd20", password: "rizakbar20" },
    { username: "alyssasd26", password: "maulidina26" },
];

export async function seedUsers() {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query("SELECT COUNT(*) as count FROM users");
        const count = (rows as any)[0].count;

        if (count === 0) {
            console.log("Seeding users...");
            const insertQuery = "INSERT INTO users (email, name, role) VALUES ?";
            const values = userList.map(user => [
                `${user.username}@sab.id`, // email
                user.username,             // name (using username as name)
                'user'                     // role
            ]);
            await conn.query(insertQuery, [values]);
            console.log("Users seeded successfully.");
        } else {
            console.log("Users table is not empty, skipping seed.");
        }
    } catch (error) {
        console.error("Error seeding users:", error);
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