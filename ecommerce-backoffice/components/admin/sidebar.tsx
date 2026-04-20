"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  Settings,
  Clock,
  ShoppingCart,
  FolderOpen,
  Wallet,
  FileText,
  Ticket,
  Image,
  MessageSquare,
  Phone,
  Gift,
  Handshake,
  Briefcase,
  UserCircle,
  Target,
  CheckSquare,
  StickyNote,
  Mail,
  Receipt,
  Package,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";

const mainLinks = [
  { href: "/admin", label: "Хянах самбар", icon: Home },
  { href: "/admin/users", label: "Хэрэглэгч", icon: Users },
  { href: "/admin/product", label: "Бүтээгдэхүүн", icon: Settings },
  { href: "/admin/order", label: "Захиалга", icon: ShoppingCart },
  { href: "/admin/qpay", label: "Qpay төлбөрүүд", icon: ShoppingCart },
  { href: "/admin/categories", label: "Ангилал", icon: FolderOpen },
  { href: "/admin/bank-accounts", label: "Банкны данс", icon: Wallet },
  { href: "/admin/coupons", label: "Урамшуулал", icon: Ticket },
  { href: "/admin/banners", label: "Баннер", icon: Image },
  { href: "/admin/footer", label: "Footer", icon: FileText },
  { href: "/admin/complaints", label: "Гомдол", icon: MessageSquare },
  { href: "/admin/call-sales", label: "Утасны харилцаа", icon: Phone },
  { href: "/admin/gift-settings", label: "Бэлгийн тохиргоо", icon: Gift },
  { href: "/admin/partners", label: "Хамтран ажиллагсад", icon: Handshake },
];

const crmLinks = [
  { href: "/admin/crm", label: "CRM хянах самбар", icon: Briefcase },
  { href: "/admin/crm/customers", label: "Харилцагчид", icon: UserCircle },
  { href: "/admin/crm/contacts", label: "Холбоо барих", icon: UserCircle },
  { href: "/admin/crm/deals", label: "Гүйлгээ", icon: Target },
  { href: "/admin/crm/tasks", label: "Даалгавар", icon: CheckSquare },
  { href: "/admin/crm/notes", label: "Тэмдэглэл", icon: StickyNote },
  { href: "/admin/crm/sms", label: "SMS", icon: MessageSquare },
  { href: "/admin/crm/emails", label: "И-мэйл", icon: Mail },
  { href: "/admin/crm/invoices", label: "Нэхэмжлэх", icon: Receipt },
  { href: "/admin/crm/products", label: "Бүтээгдэхүүн", icon: Package },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const isCrmRoute = pathname?.startsWith("/admin/crm");
  const [isCrmOpen, setIsCrmOpen] = useState<boolean>(!!isCrmRoute);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    core: true,
    catalog: true,
    finance: true,
    content: true,
    support: true,
  });

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
          {mainLinks.map(({ href, label, icon: Icon }) => (
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

  const groupedLinks = {
    core: mainLinks.filter((l) => ["/admin", "/admin/users", "/admin/order", "/admin/qpay"].includes(l.href)),
    catalog: mainLinks.filter((l) => ["/admin/product", "/admin/categories", "/admin/gift-settings", "/admin/partners"].includes(l.href)),
    finance: mainLinks.filter((l) => ["/admin/bank-accounts", "/admin/coupons"].includes(l.href)),
    content: mainLinks.filter((l) => ["/admin/banners", "/admin/footer"].includes(l.href)),
    support: mainLinks.filter((l) => ["/admin/complaints", "/admin/call-sales"].includes(l.href)),
  };

  const sectionTitles: Record<string, string> = {
    core: "Ерөнхий",
    catalog: "Бүтээгдэхүүн",
    finance: "Санхүү",
    content: "Контент",
    support: "Хэрэглэгчийн үйлчилгээ",
  };

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderSection = (key: keyof typeof groupedLinks) => {
    const links = groupedLinks[key];
    if (!links.length) return null;
    const isOpen = openGroups[key];

    return (
      <div key={key} className="mb-2">
        <button
          type="button"
          onClick={() => toggleGroup(key)}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted/60"
        >
          <span>{sectionTitles[key]}</span>
          {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        {isOpen && (
          <div className="mt-1 flex flex-col gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all hover:bg-muted",
                  pathname === href || (href !== "/admin" && pathname?.startsWith(href))
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-72 bg-background border-r p-4 flex flex-col">
      <div className="mb-5">
        <h1 className="text-lg font-bold">Admin Panel</h1>
        <p className="text-xs text-muted-foreground mt-1">Удирдлагын цэс</p>
      </div>
      <nav className="flex-1 overflow-y-auto pr-1">
        {renderSection("core")}
        {renderSection("catalog")}
        {renderSection("finance")}
        {renderSection("content")}
        {renderSection("support")}

        {/* CRM grouped submenu */}
        <div className="mt-3 pt-3 border-t">
          <button
            type="button"
            onClick={() => setIsCrmOpen((open) => !open)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-semibold hover:bg-muted transition",
              isCrmRoute ? "bg-muted text-primary" : "text-muted-foreground"
            )}
          >
            <span className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>CRM</span>
            </span>
            {isCrmOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          {isCrmOpen && (
            <div className="mt-1 ml-4 flex flex-col gap-1">
              {crmLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-muted transition",
                    pathname === href
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}