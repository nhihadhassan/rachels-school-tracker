"use client";

import { usePathname } from "next/navigation";

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noSidebar = pathname.startsWith("/login") || pathname.startsWith("/auth");
  return (
    <div className={noSidebar ? "" : "lg:pl-64"}>
      {children}
    </div>
  );
}
