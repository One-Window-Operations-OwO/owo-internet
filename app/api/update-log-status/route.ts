import { NextResponse } from 'next/server';
import { updateLogStatus } from '@/lib/db/logs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { log_id, status } = body;

        if (!log_id || !status) {
            return NextResponse.json(
                { success: false, error: 'Missing log_id or status' },
                { status: 400 }
            );
        }

        await updateLogStatus(Number(log_id), status);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error updating log status:", error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
