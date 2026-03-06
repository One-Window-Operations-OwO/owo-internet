import { NextResponse } from 'next/server';
import pool from "@/lib/db";

export async function GET() {
  try {
    const query = `
      SELECT DISTINCT c.npsn 
      FROM logs l 
      JOIN cutoff c ON l.cutoff_id = c.id 
      WHERE l.status = 'VERIFIED'
    `;
    
    const [rows]: any = await pool.query(query);
    
    // Filter out null/undefined NPSNs and just get the value
    const schools = rows
      .map((row: any) => row.npsn)
      .filter((npsn: string) => npsn);
    
    return NextResponse.json({ schools });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}
