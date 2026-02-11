import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            shipment_id,
            status,
            client_reject_reason,
            evidence_ids,
            auth_token, // keep for backward compatibility if passed, but prefer cookie
            csrf_token
        } = body;

        // Get token from cookie
        // Note: In Next.js App Router, cookies() is a function but in route handlers (req: Request), we use req.headers or similar
        // For NextRequest specifically we can use req.cookies
        // But here it is defined as (request: Request). We can cast or use new NextResponse(request).cookies? No.
        // Let's coerce to NextRequest or use standard headers
        const cookieHeaderVal = request.headers.get('cookie') || '';

        // Simple manual parsing or use NextRequest
        // Let's use NextRequest pattern which is better
        // BUT we need to change signature if we want specific NextRequest methods easily, 
        // OR just parse the cookie header manually to be safe with standard Request

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

        const upstreamCookieHeader = `auth_token=${accessToken}; csrf_token=${csrf_token}`;

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                accept: "*/*",
                "authorization": `Bearer ${accessToken}`,
                "x-csrf-token": csrf_token,
                "cookie": upstreamCookieHeader,
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
