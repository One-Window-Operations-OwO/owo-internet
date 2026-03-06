import { NextResponse } from 'next/server';
import pool from "@/lib/db";
import { getAllClusters } from "@/lib/db/clusters";
import { CLUSTER_COLUMN_MAP } from "@/lib/db/logs";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const npsn = searchParams.get("npsn");

        if (!npsn) {
            return NextResponse.json({ error: "NPSN is required" }, { status: 400 });
        }

        // 1. Get Cutoff (School Info)
        // We order by id DESC to get the latest entry if duplicates exist
        const [cutoffRows]: any = await pool.query(
            "SELECT * FROM cutoff WHERE npsn = ? ORDER BY id DESC LIMIT 1",
            [npsn]
        );

        if (cutoffRows.length === 0) {
            return NextResponse.json({ error: "School not found" }, { status: 404 });
        }

        const schoolData = cutoffRows[0];

        // 2. Get Logs
        const [logRows]: any = await pool.query(
            `SELECT l.*, u.name as verifikator_name 
             FROM logs l 
             LEFT JOIN users u ON l.user_id = u.id 
             WHERE l.cutoff_id = ? 
             ORDER BY l.created_at DESC`,
            [schoolData.id]
        );

        // 3. Get Clusters for mapping rejection reasons
        const clusters = await getAllClusters(); 
        // Create a map ID -> Name (sub_cluster for full reason)
        const clusterMap = new Map();
        if (Array.isArray(clusters)) {
            clusters.forEach((c: any) => {
                // Use nama_opsi (short) or sub_cluster (long description)
                // Using sub_cluster as it's more descriptive for "keterangan"
                clusterMap.set(c.id, c.sub_cluster); 
            });
        }

        // 4. Construct response
        const formattedLogs = logRows.map((log: any) => {
            let keterangan = "OK";
            if (log.status === 'REJECTED') {
                const reasons: string[] = [];
                // Check all rejection columns
                Object.values(CLUSTER_COLUMN_MAP).forEach((colName) => {
                     const rejectionId = log[colName];
                     if (rejectionId && clusterMap.has(rejectionId)) {
                         reasons.push(clusterMap.get(rejectionId));
                     }
                });
                if (reasons.length > 0) {
                    keterangan = reasons.join(", ");
                } else {
                    keterangan = "Ditolak";
                }
            } else if (log.status === 'SENDING') {
                 keterangan = "Sedang Diverifikasi";
            }

            return {
                id: log.id,
                npsn: schoolData.npsn,
                sn_bapp: log.serial_number, // "sn itu dari logs.serial number"
                tanggal_verifikasi: log.created_at,
                verifikator: log.verifikator_name || "-",
                status: log.status.toLowerCase(), // "verified" in example is lowercase
                keterangan: keterangan
            };
        });

        // Determine "school.sn". Using the latest log's SN if available.
        const latestLog = logRows.length > 0 ? logRows[0] : null;

        const response = {
            school: {
                npsn: schoolData.npsn,
                kode: schoolData.shipment_id ? String(schoolData.shipment_id) : "-",
                nama_sekolah: schoolData.school_name,
                sn: latestLog ? latestLog.serial_number : "-",
                termin: 1, // Placeholder
            },
            logs: formattedLogs
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching school details:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
