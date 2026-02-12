import { NextResponse } from 'next/server';
import { insertLog, CLUSTER_COLUMN_MAP, ClusterValues } from '@/lib/db/logs';
import { getAllClusters } from '@/lib/db/clusters';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            cutoff_id,
            serial_number,
            user_id,
            rejections, // Record<string, string> -> main_cluster: sub_cluster_name
            tanggal_bapp
        } = body;

        // basic validation
        if (!cutoff_id || !serial_number || !user_id) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Fetch all clusters to map names to IDs
        // This is necessary because frontend sends sub_cluster names (strings)
        // but the logs table requires foreign key IDs (integers).
        const allClusters = await getAllClusters();

        // Create a lookup map: `${main_cluster}:${sub_cluster_name}` -> id
        const clusterMap = new Map<string, number>();
        (allClusters as any[]).forEach((c: any) => {
            clusterMap.set(`${c.main_cluster}:${c.sub_cluster}`, c.id);
        });

        // Prepare ClusterValues
        const clusterValues: ClusterValues = {};

        if (rejections) {
            Object.entries(rejections).forEach(([mainCluster, subClusterName]) => {
                const colName = CLUSTER_COLUMN_MAP[mainCluster];
                if (colName) {
                    const key = `${mainCluster}:${subClusterName}`;
                    const clusterId = clusterMap.get(key);

                    if (clusterId) {
                        // We use type assertion or index access carefully
                        (clusterValues as any)[colName] = clusterId;
                    } else {
                        console.warn(`Could not find cluster ID for ${key}`);
                    }
                }
            });
        }

        const logId = await insertLog(
            Number(cutoff_id),
            serial_number,
            Number(user_id),
            clusterValues,
            tanggal_bapp
        );

        return NextResponse.json({ success: true, data: { log_id: logId } });

    } catch (error: any) {
        console.error("Error inserting log:", error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
