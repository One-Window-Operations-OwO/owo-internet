import { cookies } from "next/headers";
import { getUserByEmail } from "@/lib/db/users";

export interface AuthUser {
    email: string;
    name: string;
    local_user_id: number | null;
    local_role: string | null;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) return null;
    if (token.startsWith("local_token:")) {
        const username = token.replace("local_token:", "");
        if (username) {
            // Try as direct email first, then constructed email
            let localUser = await getUserByEmail(username);
            
            if (!localUser) {
                const constructedEmail = `${username}@sab.id`;
                localUser = await getUserByEmail(constructedEmail);
            }
            
            if (localUser) {
                return {
                    email: localUser.email,
                    name: localUser.name,
                    local_user_id: localUser.id,
                    local_role: localUser.role
                };
            }
        }
        // If local user verification fails, we still return null
        return null;
    }

    try {
        const skylinkUrl = process.env.SKYLINK_URL;
        if (!skylinkUrl) {
            console.error("SKYLINK_URL is not defined");
            return null;
        }

        const targetUrl = `${skylinkUrl}/api/v1/auth/me`;
        const response = await fetch(targetUrl, {
            headers: {
                "authorization": `Bearer ${token}`,
            },
            cache: 'no-store' // Ensure fresh check
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        // Find local user by email
        let localUser = null;
        if (data.email) {
            localUser = await getUserByEmail(data.email);
        }

        return {
            ...data,
            local_user_id: localUser?.id || null,
            local_role: localUser?.role || null
        };

    } catch (error) {
        console.error("getCurrentUser error:", error);
        return null;
    }
}
