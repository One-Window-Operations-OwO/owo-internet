import { NextResponse } from 'next/server';
import { insertLog, ClusterValues, CLUSTER_COLUMN_MAP } from '@/lib/db/logs';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { cutoff_id, serial_number, user_id, rejections } = body;

        if (!cutoff_id || !serial_number || !user_id) {
            return NextResponse.json(
                { error: 'Missing required fields: cutoff_id, serial_number, user_id' },
                { status: 400 }
            );
        }

        // Build cluster values from rejections
        // rejections is Record<string, string> where key = main_cluster name, value = sub_cluster name
        // We need to look up the cluster.id for each rejection
        const clusterValues: ClusterValues = {};

        if (rejections && typeof rejections === 'object') {
            const conn = await pool.getConnection();
            try {
                for (const [mainCluster, subCluster] of Object.entries(rejections)) {
                    const columnName = CLUSTER_COLUMN_MAP[mainCluster];
                    if (!columnName) continue;

                    // Look up cluster.id by main_cluster + sub_cluster
                    const [rows]: any = await conn.query(
                        'SELECT id FROM cluster WHERE main_cluster = ? AND sub_cluster = ?',
                        [mainCluster, subCluster]
                    );

                    if (rows.length > 0) {
                        (clusterValues as any)[columnName] = rows[0].id;
                    }
                }
            } finally {
                conn.release();
            }
        }

        // All clusters not in rejections will be null (Sesuai)
        const logId = await insertLog(cutoff_id, serial_number, user_id, clusterValues);

        return NextResponse.json({
            success: true,
            log_id: logId,
            cluster_values: clusterValues,
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
