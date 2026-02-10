import { NextResponse } from 'next/server';
import { insertLog } from '@/lib/db/logs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { cutoff_id, serial_number, user_id } = body;

        if (!cutoff_id || !serial_number || !user_id) {
            return NextResponse.json(
                { error: 'Missing required fields: cutoff_id, serial_number, user_id' },
                { status: 400 }
            );
        }

        const logId = await insertLog(cutoff_id, serial_number, user_id);

        return NextResponse.json({
            success: true,
            log_id: logId,
            message: 'Log processed successfully'
        });
    } catch (error: any) {
        console.error('Error in test-insert-log:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
