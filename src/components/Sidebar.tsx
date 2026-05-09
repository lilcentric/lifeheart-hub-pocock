"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, Users, FileText, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  userEmail: string;
  userName: string;
  userRole: string;
}

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "officer", "viewer"] },
  { href: "/onboarding", label: "Onboarding", icon: Users, roles: ["admin", "officer", "viewer"] },
  { href: "/admin/contract-templates", label: "Contract Templates", icon: FileText, roles: ["admin"] },
];

export default function Sidebar({ userEmail, userName, userRole }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-56 flex flex-col bg-white border-r border-gray-200">
      <div className="px-4 py-5 border-b border-gray-200">
        <span className="font-semibold text-gray-900 text-sm">
          Lifeheart Hub
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav
          .filter(({ roles }) => roles.includes(userRole))
          .map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200 space-y-1">
        <div className="px-3 py-2">
          <p className="text-xs font-medium text-gray-900 truncate">
            {userName || userEmail}
          </p>
          <p className="text-xs text-gray-500 capitalize">{userRole}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
