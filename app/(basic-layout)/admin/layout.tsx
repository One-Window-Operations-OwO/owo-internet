import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const user = await getCurrentUser();

    // Check if user is logged in
    if (!user) {
        redirect("/login");
    }

    // Check if user has admin role
    if (user.local_role !== 'admin') {
        redirect("/dashboard");
    }

    return <>{children}</>;
}
