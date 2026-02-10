import Link from "next/link";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-neutral-50">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-neutral-200 hidden md:flex flex-col fixed inset-y-0 z-50">
                <div className="p-6 border-b border-neutral-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <span className="text-white font-bold">O</span>
                        </div>
                        <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
                            OwO Internet
                        </h1>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <div className="px-2 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        Menu Utama
                    </div>

                    <Link
                        href="/dashboard"
                        className="group flex items-center px-3 py-2.5 text-sm font-medium text-neutral-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                    >
                        <span className="w-5 h-5 mr-3 text-neutral-400 group-hover:text-blue-500">
                            {/* Dashboard Icon */}
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                            </svg>
                        </span>
                        Dashboard
                    </Link>

                    <Link
                        href="/verifikasi"
                        className="group flex items-center px-3 py-2.5 text-sm font-medium text-neutral-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                    >
                        <span className="w-5 h-5 mr-3 text-neutral-400 group-hover:text-blue-500">
                            {/* Verification Icon */}
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </span>
                        Verifikasi
                    </Link>
                </nav>

                {/* <div className="p-4 border-t border-neutral-100">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-100">
                        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-medium text-neutral-600">
                            U
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">Admin User</p>
                            <p className="text-xs text-neutral-500 truncate">admin@owo.com</p>
                        </div>
                    </div>
                </div> */}
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 md:ml-72 transition-all duration-300">
                {/* Mobile Header */}
                <div className="md:hidden h-16 bg-white border-b border-neutral-200 flex items-center px-4 sticky top-0 z-40">
                    <h1 className="font-bold text-lg">OwO Internet</h1>
                </div>

                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
