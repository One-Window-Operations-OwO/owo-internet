
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");

    if (!path) {
        return new NextResponse("Missing path parameter", { status: 400 });
    }

    const evidenceUrl = process.env.SKYLINK_URL + "/api/v1/static";
    if (!evidenceUrl) {
        return new NextResponse("Configuration error: SKYLINK_URL not set", { status: 500 });
    }

    const targetUrl = `${evidenceUrl}/${path}`;

    try {
        const response = await fetch(targetUrl);

        if (!response.ok) {
            return new NextResponse(`Failed to fetch file: ${response.statusText}`, { status: response.status });
        }

        const contentType = response.headers.get("Content-Type") || "application/octet-stream";
        const arrayBuffer = await response.arrayBuffer();

        // Return the file with appropriate headers, allowing it to be displayed inline (not downloaded)
        return new NextResponse(arrayBuffer, {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": "inline",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("Proxy error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
