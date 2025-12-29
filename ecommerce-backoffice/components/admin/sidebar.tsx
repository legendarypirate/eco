"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Users, Settings, Clock, ShoppingCart, FolderOpen } from "lucide-react";
import { useState, useEffect } from "react";

const links = [
  { href: "/admin", label: "Хянах самбар", icon: Home },
  { href: "/admin/users", label: "Хэрэглэгч", icon: Users },
  { href: "/admin/product", label: "Бүтээгдэхүүн", icon: Settings },
  { href: "/admin/order", label: "Захиалга", icon: ShoppingCart },
    { href: "/admin/qpay", label: "Qpay төлбөрүүд", icon: ShoppingCart },
  { href: "/admin/categories", label: "Ангилал", icon: FolderOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  // This ensures we only render after component is mounted on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show loading state during initial hydration
  if (!isMounted) {
    return (
      <aside className="w-64 bg-background border-r p-4 flex flex-col">
        <h1 className="text-lg font-bold mb-6">Admin Panel</h1>
        <nav className="flex flex-col gap-2">
          {links.map(({ href, label, icon: Icon }) => (
            <div
              key={href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition",
                "bg-muted text-muted-foreground animate-pulse"
              )}
            >
              <Icon className="w-4 h-4" />
              <div className="h-4 bg-muted-foreground/20 rounded w-20"></div>
            </div>
          ))}
        </nav>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-background border-r p-4 flex flex-col">
      <h1 className="text-lg font-bold mb-6">Admin Panel</h1>
      <nav className="flex flex-col gap-2">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition",
              pathname === href || (href !== "/admin" && pathname?.startsWith(href)) 
                ? "bg-muted text-primary" 
                : "text-muted-foreground"
            )}
          >
            <Icon className="w-4 h-4" /> 
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}