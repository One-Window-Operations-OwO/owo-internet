
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
        return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    const { getUserByEmail } = await import("@/lib/db/users");
    
    // Check if using local fallback token
    if (token && token.startsWith("local_token:")) {
        const username = token.replace("local_token:", "");
        if (username) {
            // Try as direct email first, then constructed email
            let localUser = await getUserByEmail(username);
            
            if (!localUser) {
                const constructedEmail = `${username}@sab.id`;
                localUser = await getUserByEmail(constructedEmail);
            }

            if (localUser) {
                 return NextResponse.json({
                    id: localUser.id,
                    name: localUser.name,
                    email: localUser.email,
                    local_user_id: localUser.id,
                    local_role: localUser.role
                });
            }
        }
        return NextResponse.json({ message: "Invalid or expired local token" }, { status: 401 });
    }

    try {
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
