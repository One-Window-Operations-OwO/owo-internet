import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    let conn;
    try {
        const user = await getCurrentUser();
        if (!user || !user.local_user_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = user.local_role === 'admin';
        const userId = user.local_user_id;

        conn = await pool.getConnection();

        let totalData = 0;
        let pendingVerification = 0;
        let verifikasiSelesai = 0;
        let verifikasiDitolak = 0;
        let totalUsers = 0;
        let userKpis: any[] = [];

        if (isAdmin) {
            // Admin stats
            const [usersRows]: any = await conn.query('SELECT COUNT(*) as count FROM users');
            totalUsers = usersRows[0].count;

            const [cutoffRows]: any = await conn.query('SELECT COUNT(*) as count FROM cutoff');
            totalData = cutoffRows[0].count;

            const [pendingRows]: any = await conn.query(
                'SELECT COUNT(*) as count FROM cutoff LEFT JOIN logs ON cutoff.id = logs.cutoff_id WHERE logs.id IS NULL'
            );
            pendingVerification = pendingRows[0].count;

            const [verifiedRows]: any = await conn.query(
                "SELECT COUNT(*) as count FROM logs WHERE status = 'VERIFIED'"
            );
            verifikasiSelesai = verifiedRows[0].count;

            const [rejectedRows]: any = await conn.query(
                "SELECT COUNT(*) as count FROM logs WHERE status = 'REJECTED'"
            );
            verifikasiDitolak = rejectedRows[0].count;

            const [userKpiRows]: any = await conn.query(`
                SELECT 
                    u.id, 
                    u.name, 
                    COUNT(DISTINCT c.id) as total_data,
                    COUNT(DISTINCT CASE WHEN l.id IS NULL THEN c.id END) as pending_verification,
                    COUNT(DISTINCT CASE WHEN l.status = 'VERIFIED' THEN l.id END) as verifikasi_selesai,
                    COUNT(DISTINCT CASE WHEN l.status = 'REJECTED' THEN l.id END) as verifikasi_ditolak
                FROM users u
                LEFT JOIN cutoff c ON u.id = c.user_id
                LEFT JOIN logs l ON c.id = l.cutoff_id
                WHERE u.role = 'user'
                GROUP BY u.id, u.name
            `);
            userKpis = userKpiRows;

        } else {
            // User stats
            const [cutoffRows]: any = await conn.query('SELECT COUNT(*) as count FROM cutoff WHERE user_id = ?', [userId]);
            totalData = cutoffRows[0].count;

            const [pendingRows]: any = await conn.query(
                'SELECT COUNT(*) as count FROM cutoff LEFT JOIN logs ON cutoff.id = logs.cutoff_id WHERE cutoff.user_id = ? AND logs.id IS NULL',
                [userId]
            );
            pendingVerification = pendingRows[0].count;

            const [verifiedRows]: any = await conn.query(
                "SELECT COUNT(*) as count FROM logs WHERE user_id = ? AND status = 'VERIFIED'",
                [userId]
            );
            verifikasiSelesai = verifiedRows[0].count;

            const [rejectedRows]: any = await conn.query(
                "SELECT COUNT(*) as count FROM logs WHERE user_id = ? AND status = 'REJECTED'",
                [userId]
            );
            verifikasiDitolak = rejectedRows[0].count;
        }

        return NextResponse.json({
            total_data: totalData,
            pending_verification: pendingVerification,
            verifikasi_selesai: verifikasiSelesai,
            verifikasi_ditolak: verifikasiDitolak,
            ...(isAdmin && { total_users: totalUsers, user_kpis: userKpis })
        });
    } catch (error) {
        console.error('Error fetching dashboard counts:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        if (conn) {
            conn.release();
        }
    }
}
