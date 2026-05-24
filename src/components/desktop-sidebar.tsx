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

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-60 bg-white border-r border-zinc-100 z-20">
      {/* Branding */}
      <div className="px-6 py-6 border-b border-zinc-100">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-0.5">Rachel&apos;s</p>
        <h1 className="text-lg font-bold text-zinc-900 leading-tight">School Tracker</h1>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors
                ${active
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
            >
              <span className={active ? "text-white" : "text-zinc-400"}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {/* Add assignment shortcut */}
        <Link
          href="/assignments/new"
          className="mt-2 flex items-center gap-3 rounded-xl border-2 border-dashed border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add assignment
        </Link>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-zinc-100">
        <SignOutButton />
      </div>
    </aside>
  );
}
