import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest) { // Gunakan NextRequest agar lebih mudah
    try {
        const body = await request.json();
        const {
            shipment_id,
            status,
            client_reject_reason,
            evidence_ids,
            auth_token,
            csrf_token
        } = body;

        // 1. Ambil identitas asli client
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // Get token from cookie
        const cookieHeaderVal = request.headers.get('cookie') || '';
        let accessToken = auth_token;
        if (!accessToken) {
            const match = cookieHeaderVal.match(/access_token=([^;]+)/);
            if (match) accessToken = match[1];
        }

        if (!shipment_id || !status) {
            return NextResponse.json({ error: 'Missing shipment_id or status' }, { status: 400 });
        }
        if (!accessToken || !csrf_token) {
            return NextResponse.json({ error: 'Missing authentication tokens (access_token/auth_token, csrf_token)' }, { status: 401 });
        }

        const skylinkUrl = process.env.SKYLINK_URL;
        const url = `${skylinkUrl}/api/v1/shipments/${shipment_id}/status`;

        let skylinkBody: any = { status };
        if (status === 'REJECTED') {
            skylinkBody = {
                status: 'REJECTED',
                client_reject_reason: client_reject_reason || "No reason provided",
                evidence_ids: evidence_ids || []
            };
        }

        const upstreamCookieHeader = `auth_token=${accessToken}; csrf_token=${csrf_token}`;

        // 2. Kirim fetch dengan identitas client yang diteruskan
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                "accept": "*/*",
                "authorization": `Bearer ${accessToken}`,
                "x-csrf-token": csrf_token,
                "cookie": upstreamCookieHeader,
                "content-type": "application/json",
                // FORWARDING HEADERS:
                "user-agent": userAgent,
            },
            body: JSON.stringify(skylinkBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: `Skylink Error`, details: errorText }, { status: response.status });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}