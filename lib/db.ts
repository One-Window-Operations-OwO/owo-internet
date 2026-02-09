import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export default pool;

export async function createDatabaseIfNotExists() {
    const dbName = process.env.DB_NAME;
    if (!dbName) throw new Error('DB_NAME environment variable is not set');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });
    try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    } finally {
        await connection.end();
    }
}