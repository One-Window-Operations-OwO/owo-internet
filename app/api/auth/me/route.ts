
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
        return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    try {
        // Check if using local fallback token
        if (token.startsWith("local_token_")) {
            const base64Email = token.replace("local_token_", "");
            try {
                const email = Buffer.from(base64Email, 'base64').toString('utf-8');
                const { getUserByEmail } = await import("@/lib/db/users");
                const localUser = await getUserByEmail(email);

                if (localUser) {
                     return NextResponse.json({
                        id: localUser.id,
                        name: localUser.name,
                        email: localUser.email,
                        local_user_id: localUser.id,
                        local_role: localUser.role
                    });
                } else {
                    return NextResponse.json({ message: "Local user not found" }, { status: 401 });
                }
            } catch (e) {
                 return NextResponse.json({ message: "Invalid local token format" }, { status: 401 });
            }
        }

        const skylinkUrl = process.env.SKYLINK_URL;
        if (!skylinkUrl) {
            return NextResponse.json({ message: "Server configuration error" }, { status: 500 });
        }

        const targetUrl = `${skylinkUrl}/api/v1/auth/me`;

        const response = await fetch(targetUrl, {
            headers: {
                "authorization": `Bearer ${token}`,
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Skylink Auth Check Failed:", response.status, errorText);
            return NextResponse.json({ message: "Invalid or expired token", details: errorText }, { status: response.status });
        }

        const data = await response.json();

        // Find local user by email
        let localUser = null;
        if (data.email) {
            const { getUserByEmail } = await import("@/lib/db/users");
            localUser = await getUserByEmail(data.email);
        }

        return NextResponse.json({
            ...data,
            local_user_id: localUser?.id || null,
            local_role: localUser?.role || null
        });

    } catch (error) {
        console.error("Auth check error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
