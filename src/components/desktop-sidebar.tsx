"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/app/dashboard/sign-out-button";

const nav = [
  {
    href: "/dashboard",
    label: "Today",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    href: "/courses",
    label: "Courses",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
];

export function DesktopSidebar() {
  const pathname = usePathname();

  if (pathname.startsWith("/login") || pathname.startsWith("/auth")) return null;

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-slate-900 text-white z-20">
      {/* Branding */}
      <div className="px-6 py-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-none">
            <svg className="h-5 w-5 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight">Rachel&apos;s Tracker</h1>
            <p className="text-xs text-slate-400">Academic Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-1">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                    ${active
                      ? "bg-white text-slate-900"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                >
                  <span className={active ? "text-slate-900" : "text-slate-400"}>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Add assignment shortcut */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <Link
            href="/assignments/new"
            className="flex items-center gap-3 rounded-lg border border-dashed border-slate-600 px-3 py-2.5 text-sm font-medium text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add assignment
          </Link>
        </div>
      </nav>

      {/* Footer — user + sign out */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-2 py-2 mb-3 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-none text-xs font-semibold text-white">
            R
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white leading-tight">Rachel</p>
            <p className="text-xs text-slate-400 truncate">Student</p>
          </div>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
