import { NextResponse } from 'next/server';
import { getRejectionStats } from '@/lib/db/logs';

export async function GET() {
    try {
        const stats = await getRejectionStats();
        return NextResponse.json({ success: true, data: stats });
    } catch (error: any) {
        console.error('Error fetching rejection stats:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
