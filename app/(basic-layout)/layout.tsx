
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-zinc-950 transition-colors duration-300">
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 transition-all duration-300">
        {/* Mobile Header */}
        <div className="md:hidden h-16 bg-white dark:bg-zinc-900 border-b border-neutral-200 dark:border-zinc-800 flex items-center px-4 sticky top-0 z-40 transition-colors duration-300">
          <h1 className="font-bold text-lg text-neutral-900 dark:text-white">OwO Internet</h1>
        </div>

        <div className="p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
