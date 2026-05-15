"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatKES, formatDateTime, formatDate } from "@/lib/format";
import { toast } from "sonner";
import {
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Mail,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  CreditCard,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────

interface SmsLogItem {
  id: string;
  phoneNumber: string;
  message: string;
  type: string;
  status: string;
  cost: number;
  createdAt: string;
  providerMessageId: string | null;
}

interface EmailLogItem {
  id: string;
  toEmail: string;
  subject: string;
  template: string | null;
  status: string;
  createdAt: string;
  errorMessage: string | null;
}

interface SubscriberItem {
  id: string;
  user: {
    name: string | null;
    email: string;
  } | null;
  plan: string;
  status: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  paymentMethod: string | null;
}

// ── Component ──────────────────────────────────────────────

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("sms");

  // ── SMS State ──
  const [smsLogs, setSmsLogs] = useState<SmsLogItem[]>([]);
  const [smsTotal, setSmsTotal] = useState(0);
  const [smsPage, setSmsPage] = useState(1);
  const [smsSearch, setSmsSearch] = useState("");
  const [smsDebouncedSearch, setSmsDebouncedSearch] = useState("");
  const [smsStatus, setSmsStatus] = useState("all");
  const [smsType, setSmsType] = useState("all");
  const [smsLoading, setSmsLoading] = useState(true);

  // ── Email State ──
  const [emailLogs, setEmailLogs] = useState<EmailLogItem[]>([]);
  const [emailTotal, setEmailTotal] = useState(0);
  const [emailPage, setEmailPage] = useState(1);
  const [emailLoading, setEmailLoading] = useState(true);

  // ── Subscriber State ──
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [subPage, setSubPage] = useState(1);
  const [subLoading, setSubLoading] = useState(true);

  const limit = 15;

  // ── Debounce SMS search ──
  const smsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (smsTimer.current) clearTimeout(smsTimer.current);
    smsTimer.current = setTimeout(() => {
      setSmsDebouncedSearch(smsSearch);
      setSmsPage(1);
    }, 300);
    return () => {
      if (smsTimer.current) clearTimeout(smsTimer.current);
    };
  }, [smsSearch]);

  // ── Fetch SMS Logs ──
  const fetchSmsLogs = useCallback(async () => {
    setSmsLoading(true);
    const params = new URLSearchParams({
      page: String(smsPage),
      limit: String(limit),
    });
    if (smsDebouncedSearch) params.set("q", smsDebouncedSearch);
    if (smsStatus !== "all") params.set("status", smsStatus);
    if (smsType !== "all") params.set("type", smsType);

    try {
      const res = await fetch(`/api/admin/notifications/sms?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSmsLogs(Array.isArray(data.logs) ? data.logs : []);
      setSmsTotal(data.total ?? 0);
    } catch {
      toast.error("Failed to fetch SMS logs");
    } finally {
      setSmsLoading(false);
    }
  }, [smsPage, smsDebouncedSearch, smsStatus, smsType, limit]);

  // ── Fetch Email Logs ──
  const fetchEmailLogs = useCallback(async () => {
    setEmailLoading(true);
    const params = new URLSearchParams({
      page: String(emailPage),
      limit: String(limit),
    });

    try {
      const res = await fetch(`/api/admin/notifications/email?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmailLogs(Array.isArray(data.logs) ? data.logs : []);
      setEmailTotal(data.total ?? 0);
    } catch {
      toast.error("Failed to fetch email logs");
    } finally {
      setEmailLoading(false);
    }
  }, [emailPage, limit]);

  // ── Fetch Subscribers ──
  const fetchSubscribers = useCallback(async () => {
    setSubLoading(true);
    const params = new URLSearchParams({
      page: String(subPage),
      limit: String(limit),
    });

    try {
      const res = await fetch(`/api/admin/notifications/subscribers?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSubscribers(Array.isArray(data.subscribers) ? data.subscribers : []);
      setSubTotal(data.total ?? 0);
    } catch {
      toast.error("Failed to fetch subscribers");
    } finally {
      setSubLoading(false);
    }
  }, [subPage, limit]);

  useEffect(() => {
    fetchSmsLogs();
  }, [fetchSmsLogs]);
  useEffect(() => {
    if (activeTab === "email") fetchEmailLogs();
  }, [activeTab, fetchEmailLogs]);
  useEffect(() => {
    if (activeTab === "subscriptions") fetchSubscribers();
  }, [activeTab, fetchSubscribers]);

  // ── Helpers ──
  const getSmsStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-100 text-emerald-700";
      case "SENT":
        return "bg-blue-100 text-blue-700";
      case "FAILED":
        return "bg-red-100 text-red-700";
      case "PENDING":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getEmailStatusBadge = (status: string) => {
    switch (status) {
      case "SENT":
        return "bg-emerald-100 text-emerald-700";
      case "FAILED":
        return "bg-red-100 text-red-700";
      case "PENDING":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "PREMIUM_ALL":
        return "bg-indigo-100 text-indigo-700";
      case "PREMIUM_SMS":
        return "bg-violet-100 text-violet-700";
      case "FREE":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // ── Pagination helper ──
  const Pagination = ({
    page,
    total,
    onPageChange,
  }: {
    page: number;
    total: number;
    onPageChange: (p: number) => void;
  }) => {
    const totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages: (number | "...")[] = [];
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        if (page > 3) pages.push("...");
        for (
          let i = Math.max(2, page - 1);
          i <= Math.min(totalPages - 1, page + 1);
          i++
        ) {
          pages.push(i);
        }
        if (page < totalPages - 2) pages.push("...");
        pages.push(totalPages);
      }
      return pages;
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * limit + 1}–
          {Math.min(page * limit, total)} of {total}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {getPageNumbers().map((p, i) =>
            p === "..." ? (
              <span
                key={`dots-${i}`}
                className="px-2 text-muted-foreground"
              >
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={page === p ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(p as number)}
              >
                {p}
              </Button>
            )
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // ── SMS Stats ──
  const smsDelivered = smsLogs.filter(
    (l) => l.status === "DELIVERED"
  ).length;
  const smsFailed = smsLogs.filter((l) => l.status === "FAILED").length;
  const totalCost = smsLogs.reduce((s, l) => s + (l.cost || 0), 0);

  // ── Subscriber Stats ──
  const activeSubscribers = subscribers.filter(
    (s) => s.status === "ACTIVE"
  ).length;
  const premiumSmsCount = subscribers.filter(
    (s) => s.plan === "PREMIUM_SMS"
  ).length;
  const premiumAllCount = subscribers.filter(
    (s) => s.plan === "PREMIUM_ALL"
  ).length;
  const totalRevenue = subscribers
    .filter((s) => s.status === "ACTIVE")
    .reduce((s, sub) => s + (sub.amount || 0), 0);

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Notifications & SMS</h1>
        <p className="text-muted-foreground">
          Manage SMS, email delivery logs and seeker subscriptions
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sms" className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            SMS Log
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Email Log
          </TabsTrigger>
          <TabsTrigger
            value="subscriptions"
            className="flex items-center gap-1.5"
          >
            <Users className="h-3.5 w-3.5" />
            Seeker Subscriptions
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════ */}
        {/* SMS LOG TAB                                      */}
        {/* ═══════════════════════════════════════════════════ */}
        <TabsContent value="sms" className="space-y-6">
          {/* SMS Stats */}
          {smsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-14 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Send className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Total Sent
                    </p>
                    <p className="text-lg font-bold">
                      {smsTotal.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Delivered</p>
                    <p className="text-lg font-bold">
                      {smsDelivered.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Failed</p>
                    <p className="text-lg font-bold">
                      {smsFailed.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Total Cost
                    </p>
                    <p className="text-lg font-bold">{formatKES(totalCost)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* SMS Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search phone or message..."
                className="pl-9"
                value={smsSearch}
                onChange={(e) => setSmsSearch(e.target.value)}
              />
            </div>
            <Select
              value={smsStatus}
              onValueChange={(v) => {
                setSmsStatus(v);
                setSmsPage(1);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={smsType}
              onValueChange={(v) => {
                setSmsType(v);
                setSmsPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="JOB_ALERT">Job Alert</SelectItem>
                <SelectItem value="NOTIFICATION">Notification</SelectItem>
                <SelectItem value="VERIFICATION">Verification</SelectItem>
                <SelectItem value="MARKETING">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* SMS Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Message
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Cost
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {smsLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6}>
                            <Skeleton className="h-12 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : smsLogs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-12"
                        >
                          <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground font-medium">
                            No SMS logs found
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      smsLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm font-mono">
                            {log.phoneNumber}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <p className="text-sm truncate max-w-[300px]">
                              {log.message}
                            </p>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge
                              variant="outline"
                              className="text-[10px]"
                            >
                              {log.type || "SMS"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-[10px] ${getSmsStatusBadge(log.status)}`}
                              variant="outline"
                            >
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">
                            {log.cost > 0
                              ? formatKES(log.cost)
                              : "—"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                            {formatDateTime(log.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Pagination
            page={smsPage}
            total={smsTotal}
            onPageChange={setSmsPage}
          />
        </TabsContent>

        {/* ═══════════════════════════════════════════════════ */}
        {/* EMAIL LOG TAB                                     */}
        {/* ═══════════════════════════════════════════════════ */}
        <TabsContent value="email" className="space-y-6">
          {/* Email Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>To</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Template
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emailLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={5}>
                            <Skeleton className="h-12 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : emailLogs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-12"
                        >
                          <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground font-medium">
                            No email logs found
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      emailLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {log.toEmail}
                          </TableCell>
                          <TableCell>
                            <p className="text-sm truncate max-w-[250px]">
                              {log.subject}
                            </p>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge
                              variant="outline"
                              className="text-[10px]"
                            >
                              {log.template || "Custom"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-[10px] ${getEmailStatusBadge(log.status)}`}
                              variant="outline"
                            >
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                            {formatDateTime(log.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Pagination
            page={emailPage}
            total={emailTotal}
            onPageChange={setEmailPage}
          />
        </TabsContent>

        {/* ═══════════════════════════════════════════════════ */}
        {/* SEEKER SUBSCRIPTIONS TAB                         */}
        {/* ═══════════════════════════════════════════════════ */}
        <TabsContent value="subscriptions" className="space-y-6">
          {/* Subscriber Stats */}
          {subLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-14 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Total Subscribers
                    </p>
                    <p className="text-lg font-bold">
                      {subTotal.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-violet-100 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Premium SMS
                    </p>
                    <p className="text-lg font-bold">
                      {premiumSmsCount}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Bell className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Premium All
                    </p>
                    <p className="text-lg font-bold">
                      {premiumAllCount}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Revenue (KES)
                    </p>
                    <p className="text-lg font-bold">
                      {formatKES(totalRevenue)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Subscriber Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Email
                      </TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Amount
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Period End
                      </TableHead>
                      <TableHead className="hidden xl:table-cell">
                        Created
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={7}>
                            <Skeleton className="h-12 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : subscribers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-12"
                        >
                          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground font-medium">
                            No subscribers found
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      subscribers.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <p className="text-sm font-medium">
                              {sub.user?.name || "Unknown"}
                            </p>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {sub.user?.email || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-[10px] ${getPlanBadge(sub.plan)}`}
                              variant="outline"
                            >
                              {sub.plan === "PREMIUM_ALL"
                                ? "Premium All"
                                : sub.plan === "PREMIUM_SMS"
                                  ? "Premium SMS"
                                  : "Free"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                sub.status === "ACTIVE"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {sub.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">
                            {sub.amount > 0
                              ? formatKES(sub.amount)
                              : "Free"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                            {formatDate(sub.periodEnd)}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                            {formatDate(sub.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Pagination
            page={subPage}
            total={subTotal}
            onPageChange={setSubPage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
