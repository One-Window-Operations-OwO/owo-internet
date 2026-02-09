import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json(
                { message: "Username and password are required" },
                { status: 400 }
            );
        }

        const skylinkUrl = process.env.SKYLINK_URL;
        if (!skylinkUrl) {
            console.error("SKYLINK_URL is not defined in .env");
            return NextResponse.json(
                { message: "Server configuration error" },
                { status: 500 }
            );
        }

        const targetUrl = `${skylinkUrl}/api/v1/auth/login`;

        const response = await fetch(targetUrl, {
            method: "POST",
            headers: {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.7",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                email: username,
                password: password,
            }),
        });

        const data = await response.json();

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Proxy login error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
