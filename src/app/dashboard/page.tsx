"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatKES, formatRelativeTime } from "@/lib/format";
import { Users, Briefcase, FileText, CreditCard, Building2, Star, BarChart3 } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalSeekers: number;
  totalEmployers: number;
  totalCompanies: number;
  totalListings: number;
  activeListings: number;
  totalApplications: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  featuredListings: number;
  recentUsers: { id: string; name: string; email: string; role: string; county: string | null; isActive: boolean; createdAt: string }[];
  recentListings: { id: string; title: string; status: string; company: { name: string }; createdAt: string }[];
  recentPayments: { id: string; amount: number; currency: string; status: string; paymentMethod: string; company: { name: string }; createdAt: string }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((data) => { setStats(data); setLoading(false); })
      .catch((err) => { console.error("Stats fetch error:", err); setLoading(false); });
  }, []);

  const statusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-700";
      case "PAID": return "bg-green-100 text-green-700";
      case "DRAFT": return "bg-gray-100 text-gray-700";
      case "CLOSED": return "bg-red-100 text-red-700";
      case "PENDING": return "bg-yellow-100 text-yellow-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome to the JobReady admin panel</p>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : stats && (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{(stats.totalUsers ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats.totalSeekers ?? 0} seekers · {stats.totalEmployers ?? 0} employers</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Listings</p>
                    <p className="text-2xl font-bold">{(stats.activeListings ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats.totalListings ?? 0} total</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Applications</p>
                    <p className="text-2xl font-bold">{(stats.totalApplications ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">All time</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue (This Month)</p>
                    <p className="text-2xl font-bold">{formatKES(stats.monthlyRevenue ?? 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total: {formatKES(stats.totalRevenue ?? 0)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-12 w-full" /></CardContent></Card>
          ))
        ) : stats && (
          <>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Companies</p>
                  <p className="text-xl font-bold">{stats.totalCompanies}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-9 w-9 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                  <p className="text-xl font-bold">{stats.activeSubscriptions}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-9 w-9 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Star className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Featured Listings</p>
                  <p className="text-xl font-bold">{stats.featuredListings}</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard/users"><Button variant="outline" size="sm"><Users className="h-4 w-4 mr-1" /> Manage Users</Button></Link>
        <Link href="/dashboard/companies"><Button variant="outline" size="sm"><Building2 className="h-4 w-4 mr-1" /> Companies</Button></Link>
        <Link href="/dashboard/listings"><Button variant="outline" size="sm"><Briefcase className="h-4 w-4 mr-1" /> Listings</Button></Link>
        <Link href="/dashboard/analytics"><Button variant="outline" size="sm"><BarChart3 className="h-4 w-4 mr-1" /> Analytics</Button></Link>
      </div>

      {/* Recent Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Recent Registrations</CardTitle>
            <Link href="/dashboard/users"><Button variant="ghost" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-5 w-full" /></TableCell></TableRow>)
                ) : stats?.recentUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{u.name || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={u.role === "ADMIN" ? "default" : "secondary"} className="text-[10px]">{u.role}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatRelativeTime(u.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Listings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Recent Listings</CardTitle>
            <Link href="/dashboard/listings"><Button variant="ghost" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-5 w-full" /></TableCell></TableRow>)
                ) : stats?.recentListings.slice(0, 5).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium text-sm max-w-[200px] truncate">{l.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.company.name}</TableCell>
                    <TableCell><Badge className={`text-[10px] ${statusColor(l.status)}`} variant="outline">{l.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Recent Payments</CardTitle>
          <Link href="/dashboard/payments"><Button variant="ghost" size="sm">View all</Button></Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-5 w-full" /></TableCell></TableRow>)
              ) : stats?.recentPayments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm text-muted-foreground">{formatRelativeTime(p.createdAt)}</TableCell>
                  <TableCell className="text-sm font-medium">{p.company.name}</TableCell>
                  <TableCell className="text-sm font-medium">{formatKES(p.amount)}</TableCell>
                  <TableCell className="text-sm">{p.paymentMethod}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${statusColor(p.status)}`} variant="outline">{p.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
