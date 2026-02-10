import { NextResponse } from 'next/server';

export async function POST(request: Request) {
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

        if (!shipment_id || !status) {
            return NextResponse.json({ error: 'Missing shipment_id or status' }, { status: 400 });
        }

        if (!auth_token || !csrf_token) {
            return NextResponse.json({ error: 'Missing authentication tokens (auth_token, csrf_token)' }, { status: 400 });
        }

        const skylinkUrl = process.env.SKYLINK_URL;
        const url = `${skylinkUrl}/api/v1/shipments/${shipment_id}/status`;

        let skylinkBody: any = {
            status: status
        };

        if (status === 'REJECTED') {
            skylinkBody = {
                status: 'REJECTED',
                client_reject_reason: client_reject_reason || "No reason provided",
                evidence_ids: evidence_ids || []
            };
        }

        const cookieHeader = `auth_token=${auth_token}; csrf_token=${csrf_token}`;

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                accept: "*/*",
                "authorization": `Bearer ${auth_token}`,
                "x-csrf-token": csrf_token,
                "cookie": cookieHeader,
                "content-type": "application/json",
            },
            body: JSON.stringify(skylinkBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Skylink API Error:', response.status, errorText);
            return NextResponse.json({ error: `Skylink API Error: ${response.status}`, details: errorText }, { status: response.status });
        }

        if (response.status === 204) {
            return NextResponse.json({ success: true });
        }

        const data = await response.json();
        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error('Error proxying request to Skylink:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
