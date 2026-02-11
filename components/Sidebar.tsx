"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
    LuLayoutDashboard,
    LuCheckCheck,
    LuUsers,
    LuScissors,
    LuMoon,
    LuSun,
    LuLogOut
} from "react-icons/lu";

// Menu Configurations
const USER_MENU = [
    { label: "Dashboard", href: "/dashboard", Icon: LuLayoutDashboard },
    { label: "Verifikasi", href: "/verifikasi", Icon: LuCheckCheck },
];

const ADMIN_MENU = [
    { label: "Dashboard", href: "/dashboard", Icon: LuLayoutDashboard },
    { label: "Users List", href: "/admin/users", Icon: LuUsers },
    { label: "Cutoff Process", href: "/admin/cutoff", Icon: LuScissors },
];

export default function Sidebar() {
    const { user, isAdmin } = useAuth();
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const menuItems = isAdmin ? ADMIN_MENU : USER_MENU;

    // Unified Theme Styles (Tailwind Dark Mode)
    // Light: White bg, Neutral text, Blue/Zinc accents
    // Dark: Zinc-900 bg, Zinc-300 text, White accents

    return (
        <aside className="w-72 border-r hidden md:flex flex-col fixed inset-y-0 z-50 bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-800 transition-colors duration-300">
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isAdmin ? "bg-red-600" : "bg-blue-600"}`}>
                        <span className="text-white font-bold">
                            {isAdmin ? "A" : "O"}
                        </span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                        {isAdmin ? "Admin Panel" : "OwO Internet"}
                    </h1>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <div className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-zinc-500">
                    Menu
                </div>

                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                ? "bg-neutral-100 dark:bg-zinc-800 text-neutral-900 dark:text-white"
                                : "text-neutral-600 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-zinc-900 hover:text-neutral-900 dark:hover:text-zinc-200"
                                }`}
                        >
                            <item.Icon className={`w-5 h-5 mr-3 ${isActive
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-neutral-400 dark:text-zinc-500 group-hover:text-blue-500 dark:group-hover:text-blue-400"
                                }`} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / User Profile & Theme Toggle */}
            <div className="p-4 border-t border-neutral-100 dark:border-zinc-800">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3 overflow-hidden">
                        {/* Optional User Info */}
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-neutral-900 dark:text-zinc-200 truncate max-w-[120px]">
                                {user?.name || "User"}
                            </span>
                            <span className="text-xs text-neutral-500 dark:text-zinc-500 truncate max-w-[120px]">
                                {isAdmin ? "Administrator" : "Member"}
                            </span>
                        </div>
                    </div>

                    {/* Theme Toggle */}
                    {mounted && (
                        <button
                            onClick={() => {
                                const newTheme = theme === 'dark' ? 'light' : 'dark';
                                console.log("Toggling theme to:", newTheme);
                                setTheme(newTheme);
                            }}
                            className="p-2 rounded-lg text-neutral-500 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'dark' ? <LuSun className="w-5 h-5" /> : <LuMoon className="w-5 h-5" />}
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
