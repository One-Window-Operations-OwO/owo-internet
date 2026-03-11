"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
    email: string;
    role: string; // Skylink role
    scope: string;
    name: string;
    local_user_id: number | null;
    local_role: string | null;
}

interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAdmin: false,
    loading: true,
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Redirect if already logged in and on login page
        if (pathname === "/login" && user) {
            router.push("/dashboard");
        }
    }, [pathname, user, router]);

    useEffect(() => {
        // Skip check on login page if no user (let the login form handle it)
        if (pathname === "/login") {
            setLoading(false);
            return;
        }

        // Only check auth if we don't have user data yet, 
        // OR if we want to re-validate on every page load (which might be overkill but safe).
        // Since middleware handles protection, we mainly need user data.
        // Let's check only if !user to prevent loop, or use a separate flag.

        // Actually, with middleware, we know we are authorized if we reach here (except public routes).
        // Safest is to just checkAuth on mount/pathname, but NOT depend on user.
        checkAuth();
    }, [pathname]); // REMOVED user dependency to avoid loop: checkAuth -> setUser -> useEffect -> checkAuth

    const checkAuth = async () => {
        // setLoading(true); // Don't set loading true on every nav, causes flicker

        // We don't need to check localStorage anymore, cookie is sent automatically
        try {
            console.log("Checking auth via cookie...");
            // Check if token is valid
            const res = await fetch("/api/auth/me", {
                method: "GET", // Changed to GET
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) {
                console.warn("Auth check failed:", res.status, res.statusText);

                // If 401 (Unauthorized), try auto-relogin
                if (res.status === 401 || res.status === 403) {
                    console.log("Token expired/invalid, attempting auto-relogin...");
                    await performAutoLogin();
                } else {
                    setUser(null);
                }
            } else {
                const data = await res.json();
                console.log("Auth check success:", data);
                setUser(data);
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const performAutoLogin = async () => {
        const username = localStorage.getItem("auth_username");
        const password = localStorage.getItem("auth_password");

        if (!username || !password) {
            console.log("No stored credentials found for auto-relogin.");
            // If no credentials, just clear user and let middleware handle redirect or stay on public page
            setUser(null);
            return;
        }

        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                const data = await res.json();
                console.log("Auto-relogin successful");

                // Update local storage items
                if (data.csrf_token) localStorage.setItem("csrf_token", data.csrf_token);
                if (data.user_id) localStorage.setItem("user_id", String(data.user_id));
                if (data.access_token) localStorage.setItem("access_token", data.access_token);

                // Reload to refresh cookie state in browser
                window.location.reload();
            } else {
                console.error("Auto-relogin failed even with stored creds.");
                setUser(null);
                // Optional: router.push("/login"); // Let middleware handle it
            }
        } catch (error) {
            console.error("Auto-relogin error:", error);
            setUser(null);
        }
    };

    const isAdmin = user?.local_role === 'admin';

    return (
        <AuthContext.Provider value={{ user, isAdmin, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
