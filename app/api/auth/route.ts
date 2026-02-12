import { NextRequest, NextResponse } from "next/server";
import { createUserIfNotExists, verifyLocalCredentials } from "@/lib/db/users";

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json(
                { message: "Username and password are required" },
                { status: 400 }
            );
        }

        let data: any = null;
        let authSuccess = false;
        let csrfToken = null;
        let headers: Headers | null = null;
        let emailForDb = username;

        // Try Skylink login
        const skylinkUrl = process.env.SKYLINK_URL;
        if (skylinkUrl) {
            try {
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

                if (response.ok) {
                    data = await response.json();
                    authSuccess = true;
                    headers = response.headers;
                    emailForDb = username;
                }
            } catch (err) {
                // Log strictly as info/warning to indicate fallback, not a crash
                console.log(`Skylink unreachable (${(err as Error).message}). Switching to local authentication.`);
            }
        }

        // Fallback to local login
        if (!authSuccess) {
            console.log("Attempting local login details check for:", username);
            
            // Support both "username" and "username@sab.id" formats for local check
            let cleanUsername = username;
            if (username.includes("@")) {
                cleanUsername = username.split("@")[0];
            }

            const localUser = verifyLocalCredentials(cleanUsername, password);
            if (localUser) {
                authSuccess = true;
                
                // Ensure email format matches what seedUsers expects
                emailForDb = username.includes("@") ? username : `${username}@sab.id`;
                
                // Encode email in token for /me endpoint to identify user
                const tokenPayload = Buffer.from(emailForDb).toString('base64');
                
                data = {
                    name: localUser.username,
                    access_token: `local_token_${tokenPayload}`,
                    local_login: true
                };
                
                console.log("Local login successful for:", cleanUsername);
            } else {
                 console.log("Local login failed: User not found in local seed list or password mismatch.");
            }
        }

        if (!authSuccess) {
            return NextResponse.json(
                { message: "Invalid credentials" },
                { status: 401 }
            );
        }

        console.log("Login Successful Keys:", Object.keys(data));

        if (headers) {
            const cookie = headers.get("set-cookie");
            if (cookie) {
                const match = cookie.match(/csrf_token=([^;]+)/);
                if (match) {
                    csrfToken = match[1];
                }
            }
        }

        const name = data.name;
        // Use the appropriate email (username from input for skylink, constructed email for local)
        const userRecord = await createUserIfNotExists(emailForDb, name);
        
        const jsonResponse = NextResponse.json({ ...data, csrf_token: csrfToken, user_id: userRecord?.id }, { status: 200 });

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
        console.error("Login error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
