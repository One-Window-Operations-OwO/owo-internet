"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Login failed");
            }

            setSuccess("Login successful! Redirecting...");
            console.log("Login success:", data);

            localStorage.setItem("token", data.access_token);
            if (data.csrf_token) {
                localStorage.setItem("csrf_token", data.csrf_token);
            }

            setTimeout(() => router.push("/dashboard"), 1000);

        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black text-foreground">
            <div className="w-full max-w-md rounded-lg bg-white dark:bg-zinc-900 p-8 shadow-md border border-gray-200 dark:border-zinc-800">
                <h1 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">Login</h1>

                {error && (
                    <div className="mb-4 rounded bg-red-100 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-200 border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 rounded bg-green-100 dark:bg-green-900/30 p-3 text-sm text-green-700 dark:text-green-200 border border-green-200 dark:border-green-800">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="username">
                            Email / Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full rounded-md py-2 text-white transition-colors ${loading
                            ? "cursor-not-allowed bg-blue-300 dark:bg-blue-800/50"
                            : "bg-black dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                            }`}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
}
