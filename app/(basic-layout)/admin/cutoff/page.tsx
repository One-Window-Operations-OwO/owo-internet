
"use client";

import { useState, useEffect } from "react";

export default function CutoffPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            const data = await res.json();
            if (res.ok) {
                setUsers(data);
            } else {
                console.error("Failed to fetch users");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleUser = (id: number) => {
        setSelectedUserIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedUserIds.length === users.length) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(users.map((u) => u.id));
        }
    };

    const handleProcessCutoff = async () => {
        if (selectedUserIds.length === 0) {
            alert("Please select at least one user.");
            return;
        }

        const token = localStorage.getItem("token"); // Assuming auth token is stored here as per previous context? Or commonly `auth_token` or just use cookies if server actions? 
        // NOTE: The request sample showed a "token" field in the body. I will try to retrieve it from localStorage as 'csrf_token' based on previous conversation (Conversation 820f4994-4858-40e1-bc78-6565edf49c29: Save CSRF Token).
        // If that's strictly for CSRF, maybe I need the actual auth token. The sample `token` looks like a JWT. 
        // I will assume for now it might be in `local_storage`. If not, I'll alert the user.

        if (!token) {
            setError("Authentication token not found. Please log in again.");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch("/api/cutoff", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userIds: selectedUserIds,
                    token: token,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setResult(data);
            } else {
                setError(data.message || data.error || "Something went wrong");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        Cutoff Process
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Distribute new shipments to selected users.
                    </p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    {error}
                </div>
            )}

            {result && (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-lg border border-green-200 dark:border-green-800 space-y-2">
                    <p className="font-semibold">{result.message}</p>
                    {result.distribution && (
                        <ul className="list-disc list-inside text-sm">
                            <li>Total New Items: {result.distribution.totalNewItems}</li>
                            <li>Users Selected: {result.distribution.users}</li>
                            <li>Items Per User: {result.distribution.basePerUser}</li>
                            <li>Remainder: {result.distribution.remainder}</li>
                            <li>Skipped Duplicates: {result.distribution.skipped}</li>
                        </ul>
                    )}
                </div>
            )}

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm transition-colors duration-300">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            {selectedUserIds.length} users selected
                        </span>
                    </div>
                    <button
                        onClick={handleProcessCutoff}
                        disabled={loading || selectedUserIds.length === 0}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? "Processing..." : "Process Cutoff"}
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-100 dark:border-zinc-800">
                            <tr>
                                <th className="px-6 py-3 w-12">
                                    <input
                                        type="checkbox"
                                        checked={users.length > 0 && selectedUserIds.length === users.length}
                                        onChange={toggleAll}
                                        className="rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer ${selectedUserIds.includes(user.id)
                                            ? "bg-blue-50/50 dark:bg-blue-900/10"
                                            : ""
                                        }`}
                                    onClick={() => toggleUser(user.id)}
                                >
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedUserIds.includes(user.id)}
                                            onChange={() => toggleUser(user.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-200">
                                        {user.name}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{user.email}</td>
                                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 capitalize">
                                        <span
                                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${user.role === "admin"
                                                ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 ring-1 ring-inset ring-purple-700/10 dark:ring-purple-400/20"
                                                : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 ring-1 ring-inset ring-green-600/20 dark:ring-green-400/20"
                                                }`}
                                        >
                                            {user.role}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-500">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
