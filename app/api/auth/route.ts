import { NextRequest, NextResponse } from "next/server";
import { createUserIfNotExists } from "@/lib/db/users";

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
        console.log("Skylink Login Response Keys:", Object.keys(data));

        const cookie = response.headers.get("set-cookie");
        let csrfToken = null;

        if (cookie) {
            const match = cookie.match(/csrf_token=([^;]+)/);
            if (match) {
                csrfToken = match[1];
            }
        }

        let userRecord = null;
        if (response.ok) {
            const name = data.name;
            userRecord = await createUserIfNotExists(username, name);
        }
        const jsonResponse = NextResponse.json({ ...data, csrf_token: csrfToken, user_id: userRecord?.id }, { status: response.status });

        // Set access_token cookie
        if (data.access_token) {
            jsonResponse.cookies.set("access_token", data.access_token, {
                httpOnly: true,
                path: "/",
                maxAge: 60 * 60 * 24 * 7, // 7 days
                sameSite: "strict",
                secure: process.env.NODE_ENV === "production",
            });
        }

        return jsonResponse;
    } catch (error) {
        console.error("Proxy login error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
