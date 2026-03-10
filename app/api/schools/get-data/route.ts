import { NextResponse } from 'next/server';
import pool from "@/lib/db";

export async function GET() {
    try {
        const countQuery = `SELECT COUNT(*) as count FROM logs WHERE status = 'VERIFIED'`;
        const [countRows]: any = await pool.query(countQuery);
        const verifiedCount = countRows[0]?.count || 0;
        const [rows] = await pool.query("select cutoff.npsn, cutoff.school_name from cutoff join logs on cutoff.id = logs.cutoff_id where logs.status = 'VERIFIED'");
        return NextResponse.json({ rows, verifiedCount });
    } catch (error) {
        console.error("Database error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}