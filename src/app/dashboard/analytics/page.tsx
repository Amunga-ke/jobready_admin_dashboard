"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { formatKES } from "@/lib/format";
import {
  Users, Building2, Briefcase, FileText, CreditCard, BarChart3,
  TrendingUp, Award, MapPin, CalendarDays, Activity,
} from "lucide-react";

interface Analytics {
  totalUsers: number;
  seekers: number;
  employers: number;
  totalCompanies: number;
  verifiedCompanies: number;
  totalListings: number;
  activeListings: number;
  featuredListings: number;
  totalApplications: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  topCompanies: { name: string; listings: number; applications: number }[];
  topCategories: { name: string; listings: number }[];
  topCounties: { name: string; listings: number }[];
  recentRegistrations: { date: string; count: number }[];
  recentListingCreations: { date: string; count: number }[];
  subscriptionDistribution: { free: number; starter: number; pro: number; enterprise: number };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const kpiCards = loading
    ? Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
      ))
    : data && [
        { label: "Total Users", value: data.totalUsers.toLocaleString(), sub: `${data.seekers} seekers · ${data.employers} employers`, icon: Users, color: "bg-indigo-100 text-indigo-600" },
        { label: "Companies", value: data.totalCompanies.toLocaleString(), sub: `${data.verifiedCompanies} verified`, icon: Building2, color: "bg-purple-100 text-purple-600" },
        { label: "Active Listings", value: data.activeListings.toLocaleString(), sub: `${data.totalListings} total`, icon: Briefcase, color: "bg-green-100 text-green-600" },
        { label: "Total Applications", value: data.totalApplications.toLocaleString(), sub: "All time", icon: FileText, color: "bg-blue-100 text-blue-600" },
        { label: "Total Revenue", value: formatKES(data.totalRevenue), sub: `This month: ${formatKES(data.monthlyRevenue)}`, icon: CreditCard, color: "bg-amber-100 text-amber-600" },
        { label: "Active Subscriptions", value: data.activeSubscriptions.toLocaleString(), sub: "Currently active", icon: Activity, color: "bg-cyan-100 text-cyan-600" },
      ].map((kpi) => (
        <Card key={kpi.label}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
              </div>
              <div className={`h-10 w-10 rounded-lg ${kpi.color} flex items-center justify-center flex-shrink-0`}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ));

  const subDist = data?.subscriptionDistribution || { free: 0, starter: 0, pro: 0, enterprise: 0 };
  const maxSub = Math.max(subDist.free, subDist.starter, subDist.pro, subDist.enterprise, 1);

  const subPlans = [
    { name: "Free", count: subDist.free, color: "bg-gray-400" },
    { name: "Starter", count: subDist.starter, color: "bg-blue-500" },
    { name: "Pro", count: subDist.pro, color: "bg-purple-500" },
    { name: "Enterprise", count: subDist.enterprise, color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6" /> Analytics</h1>
        <p className="text-muted-foreground">Platform analytics and insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards}
      </div>

      {/* Growth Charts Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><CalendarDays className="h-4 w-4" /> User Registrations (Last 30 Days)</CardTitle>
            <CardDescription>
              {loading ? "Loading..." : data ? `${data.recentRegistrations.reduce((s, r) => s + r.count, 0)} total registrations` : "—"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : data && data.recentRegistrations.length > 0 ? (
              <div className="flex items-end gap-1 h-48">
                {data.recentRegistrations.map((r) => {
                  const maxCount = Math.max(...data.recentRegistrations.map((x) => x.count), 1);
                  const height = Math.max((r.count / maxCount) * 100, 4);
                  return (
                    <div key={r.date} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">{r.count}</span>
                      <div className="w-full bg-indigo-500 rounded-t" style={{ height: `${height}%` }} title={`${r.date}: ${r.count}`} />
                      <span className="text-[9px] text-muted-foreground rotate-45 origin-top hidden sm:block">
                        {new Date(r.date).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No registration data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Listing Creations (Last 30 Days)</CardTitle>
            <CardDescription>
              {loading ? "Loading..." : data ? `${data.recentListingCreations.reduce((s, r) => s + r.count, 0)} total listings` : "—"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : data && data.recentListingCreations.length > 0 ? (
              <div className="flex items-end gap-1 h-48">
                {data.recentListingCreations.map((r) => {
                  const maxCount = Math.max(...data.recentListingCreations.map((x) => x.count), 1);
                  const height = Math.max((r.count / maxCount) * 100, 4);
                  return (
                    <div key={r.date} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">{r.count}</span>
                      <div className="w-full bg-green-500 rounded-t" style={{ height: `${height}%` }} title={`${r.date}: ${r.count}`} />
                      <span className="text-[9px] text-muted-foreground rotate-45 origin-top hidden sm:block">
                        {new Date(r.date).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No listing data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Companies */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4" /> Top Companies by Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-right">Listings</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Apps</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-5 w-full" /></TableCell></TableRow>)
                ) : (data?.topCompanies || []).length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-6 text-sm text-muted-foreground">No data</TableCell></TableRow>
                ) : (data?.topCompanies || []).map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm truncate max-w-[140px]">{c.name}</TableCell>
                    <TableCell className="text-right text-sm">{c.listings}</TableCell>
                    <TableCell className="text-right text-sm hidden sm:table-cell text-muted-foreground">{c.applications}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Briefcase className="h-4 w-4" /> Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Listings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={2}><Skeleton className="h-5 w-full" /></TableCell></TableRow>)
                ) : (data?.topCategories || []).length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-6 text-sm text-muted-foreground">No data</TableCell></TableRow>
                ) : (data?.topCategories || []).map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm truncate max-w-[140px]">{c.name}</TableCell>
                    <TableCell className="text-right text-sm">{c.listings}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Counties */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Top Counties</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>County</TableHead>
                  <TableHead className="text-right">Listings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={2}><Skeleton className="h-5 w-full" /></TableCell></TableRow>)
                ) : (data?.topCounties || []).length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-6 text-sm text-muted-foreground">No data</TableCell></TableRow>
                ) : (data?.topCounties || []).map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm truncate max-w-[140px]">{c.name}</TableCell>
                    <TableCell className="text-right text-sm">{c.listings}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" /> Subscription Distribution</CardTitle>
          <CardDescription>Breakdown of active subscription plans</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="space-y-4">
              {subPlans.map((plan) => (
                <div key={plan.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{plan.name}</span>
                    <span className="text-muted-foreground">{plan.count} active</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${plan.color}`}
                      style={{ width: `${maxSub > 0 ? (plan.count / maxSub) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
