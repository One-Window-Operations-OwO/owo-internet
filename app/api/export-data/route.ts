import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
    try {
        const query = `
            SELECT
                c.shipment_id,
                c.school_name,
                c.npsn,
                c.resi_number,
                c.starlink_id,
                c.received_date,
                l.id as log_id,
                l.status,
                l.tanggal_bapp,
                l.serial_number as log_serial_number,
                l.denda,
                c_geo.nama_opsi as geo_tagging,
                c_fs.nama_opsi as foto_sekolah,
                c_fb.nama_opsi as foto_box_dan_pic,
                c_ku.nama_opsi as kelengkapan_unit,
                c_fsk.nama_opsi as foto_serial_number_kardus,
                c_snb.nama_opsi as serial_number_bapp,
                c_pti.nama_opsi as perangkat_terhubung_internet,
                c_bapp.nama_opsi as bapp,
                u.name
            FROM logs l
            JOIN cutoff c ON l.cutoff_id = c.id
            LEFT JOIN cluster c_geo ON l.geo_tagging = c_geo.id
            LEFT JOIN cluster c_fs ON l.foto_sekolah = c_fs.id
            LEFT JOIN cluster c_fb ON l.foto_box_dan_pic = c_fb.id
            LEFT JOIN cluster c_ku ON l.kelengkapan_unit = c_ku.id
            LEFT JOIN cluster c_fsk ON l.foto_serial_number_kardus = c_fsk.id
            LEFT JOIN cluster c_snb ON l.serial_number_bapp = c_snb.id
            LEFT JOIN cluster c_pti ON l.perangkat_terhubung_internet = c_pti.id
            LEFT JOIN cluster c_bapp ON l.bapp = c_bapp.id
            LEFT JOIN users u ON l.user_id = u.id
            WHERE l.id IN (
                SELECT MAX(l2.id)
                FROM logs l2
                JOIN cutoff c2 ON l2.cutoff_id = c2.id
                GROUP BY c2.npsn
            )
        `;

        const [rows] = await pool.query<RowDataPacket[]>(query);

        if (!Array.isArray(rows) || rows.length === 0) {
            return new NextResponse('No data found', { status: 404 });
        }

        const headers = [
            'Shipment ID', 'School Name', 'NPSN', 'Resi Number', 'Starlink ID', 'Received Date',
            'Log ID', 'Status', 'Tanggal BAPP', 'Log Serial Number', 'Denda',
            'Geo Tagging', 'Foto Sekolah', 'Foto Box & PIC', 'Kelengkapan Unit',
            'Foto Serial Number Kardus', 'Serial Number BAPP', 'Perangkat Terhubung Internet',
            'BAPP', 'User Name'
        ];

        const dbKeys = [
            'shipment_id', 'school_name', 'npsn', 'resi_number', 'starlink_id', 'received_date',
            'log_id', 'status', 'tanggal_bapp', 'log_serial_number', 'denda',
            'geo_tagging', 'foto_sekolah', 'foto_box_dan_pic', 'kelengkapan_unit',
            'foto_serial_number_kardus', 'serial_number_bapp', 'perangkat_terhubung_internet',
            'bapp', 'name'
        ];

        const csvRows = rows.map((row: any) => {
            return dbKeys.map(key => {
                let value = row[key];
                if (value === null || value === undefined) return '';
                
                if (value instanceof Date) {
                    value = value.toISOString().split('T')[0];
                }
                
                const stringValue = String(value).replace(/"/g, '""');
                return `"${stringValue}"`;
            }).join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="logs_export.csv"',
            },
        });

    } catch (error) {
        console.error('Error exporting logs:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
