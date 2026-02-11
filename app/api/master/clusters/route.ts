import { NextResponse } from 'next/server';
import { getAllClusters } from '@/lib/db/clusters';

export async function GET() {
    try {
        const clusters = await getAllClusters();
        console.log("Fetched clusters:", clusters);
        return NextResponse.json({ success: true, data: clusters });
    } catch (error) {
        console.error("Failed to fetch clusters:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch clusters" }, { status: 500 });
    }
}
