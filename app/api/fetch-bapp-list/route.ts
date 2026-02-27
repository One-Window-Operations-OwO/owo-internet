
import { NextResponse } from 'next/server';
import { getUnloggedCutoffByUser } from '@/lib/db/cutoff';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const data = await getUnloggedCutoffByUser(userId);

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error: any) {
        console.error('Error fetching BAPP list:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
