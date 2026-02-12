import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const cutoffId = searchParams.get("cutoff_id");

    if (!id) {
      return NextResponse.json(
        { message: "Shipment ID is required" },
        { status: 400 }
      );
    }

    const accessToken = req.cookies.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { message: "Unauthorized - No access token" },
        { status: 401 }
      );
    }

    const skylinkUrl = process.env.SKYLINK_URL;
    const authHeader = `Bearer ${accessToken}`;

    // Fetch both endpoints in parallel
    const [shipmentRes, evidencesRes] = await Promise.all([
      fetch(`${skylinkUrl}/api/v1/shipments/${id}`, {
        headers: {
          Authorization: authHeader,
          accept: "*/*",
        },
      }),
      fetch(`${skylinkUrl}/api/v1/evidences?shipment_id=${id}`, {
        headers: {
          Authorization: authHeader,
          accept: "*/*",
        },
      }),
    ]);

    if (!shipmentRes.ok) {
      return NextResponse.json(
        { message: "Failed to fetch shipment data" },
        { status: shipmentRes.status }
      );
    }

    if (!evidencesRes.ok) {
      return NextResponse.json(
        { message: "Failed to fetch evidences data" },
        { status: evidencesRes.status }
      );
    }

    const shipmentData = await shipmentRes.json();
    const evidencesData = await evidencesRes.json();

    // Fetch history logs if cutoff_id is provided
    let history: any[] = [];
    if (cutoffId) {
      const numericCutoffId = Number(cutoffId);
      if (!isNaN(numericCutoffId)) {
        const conn = await pool.getConnection();
        try {
          const [rows]: any = await conn.query(
            `SELECT 
                l.id, l.status, l.serial_number, l.tanggal_bapp, l.created_at,
                l.user_id, u.name,
                l.geo_tagging, l.foto_sekolah, l.foto_box_dan_pic,
                l.kelengkapan_unit, l.foto_serial_number_kardus,
                l.serial_number_bapp, l.perangkat_terhubung_internet, l.bapp
             FROM logs l
             LEFT JOIN users u ON l.user_id = u.id
             WHERE l.cutoff_id = ?
             ORDER BY l.created_at DESC`,
            [numericCutoffId]
          );

          const clusterColumns = [
            'geo_tagging', 'foto_sekolah', 'foto_box_dan_pic',
            'kelengkapan_unit', 'foto_serial_number_kardus',
            'serial_number_bapp', 'perangkat_terhubung_internet', 'bapp'
          ];

          for (const row of rows) {
            const rejections: Record<string, string> = {};
            const clusterIds = clusterColumns
              .map(col => row[col])
              .filter((v: any) => v != null);

            if (clusterIds.length > 0) {
              const [clusters]: any = await conn.query(
                `SELECT id, main_cluster, sub_cluster FROM cluster WHERE id IN (?)`,
                [clusterIds]
              );
              const clusterMap = new Map<number, any>();
              clusters.forEach((c: any) => clusterMap.set(c.id, c));

              for (const col of clusterColumns) {
                if (row[col] != null) {
                  const cluster = clusterMap.get(row[col]);
                  if (cluster) {
                    rejections[cluster.main_cluster] = cluster.sub_cluster;
                  }
                }
              }
            }

            history.push({
              id: row.id,
              status: row.status,
              serial_number: row.serial_number,
              tanggal_bapp: row.tanggal_bapp,
              created_at: row.created_at,
              username: row.name || `User #${row.user_id}`,
              rejections,
            });
          }
        } finally {
          conn.release();
        }
      }
    }

    return NextResponse.json({
      shipment: shipmentData,
      evidences: evidencesData,
      history,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
