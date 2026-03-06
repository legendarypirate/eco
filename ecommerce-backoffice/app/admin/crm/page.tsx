"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Users, CheckSquare, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function CRMDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    deals?: { won: number; lost: number; open: number; wonAmount: number; openAmount: number };
    totalCustomers?: number;
    pendingTasks?: number;
    recentSms?: Array<{ id: number; message: string; status: string; created_at: string; customer?: { name: string } }>;
    recentEmails?: Array<{ id: number; subject: string; status: string; created_at: string; customer?: { name: string } }>;
  } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/crm/dashboard`);
        if (res.ok) setStats(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CRM Хянах самбар</h1>
        <p className="text-muted-foreground">Гүйлгээ, харилцагч, даалгаврын тойм</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Нийт харилцагч</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalCustomers ?? 0}</p>
            <Link href="/admin/crm/customers">
              <Button variant="link" className="p-0 h-auto text-xs">Жагсаалт харах</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Идэвхтэй гүйлгээ (Open)</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.deals?.open ?? 0}</p>
            <p className="text-xs text-muted-foreground">Дүн: {(stats?.deals?.openAmount ?? 0).toLocaleString()}</p>
            <Link href="/admin/crm/deals">
              <Button variant="link" className="p-0 h-auto text-xs">Гүйлгээ</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Хожсон гүйлгээ (Won)</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.deals?.won ?? 0}</p>
            <p className="text-xs text-muted-foreground">Дүн: {(stats?.deals?.wonAmount ?? 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Хүлээгдэж буй даалгавар</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.pendingTasks ?? 0}</p>
            <Link href="/admin/crm/tasks">
              <Button variant="link" className="p-0 h-auto text-xs">Даалгавар</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Сүүлийн SMS
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentSms?.length ? (
              <ul className="space-y-2 text-sm">
                {stats.recentSms.map((s) => (
                  <li key={s.id} className="flex justify-between border-b pb-2">
                    <span className="truncate max-w-[200px]">{s.message}</span>
                    <span className="text-muted-foreground">{s.customer?.name ?? "-"}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">SMS байхгүй</p>
            )}
            <Link href="/admin/crm/sms">
              <Button variant="outline" size="sm" className="mt-2">Бүгдийг харах</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Сүүлийн И-мэйл
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentEmails?.length ? (
              <ul className="space-y-2 text-sm">
                {stats.recentEmails.map((e) => (
                  <li key={e.id} className="flex justify-between border-b pb-2">
                    <span className="truncate max-w-[200px]">{e.subject || "(No subject)"}</span>
                    <span className="text-muted-foreground">{e.customer?.name ?? "-"}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">И-мэйл байхгүй</p>
            )}
            <Link href="/admin/crm/emails">
              <Button variant="outline" size="sm" className="mt-2">Бүгдийг харах</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
