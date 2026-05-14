"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatKES, formatDate, formatDateTime, formatRelativeTime } from "@/lib/format";
import { toast } from "sonner";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Eye,
  Building2,
  User,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  Layers,
  Sparkles,
  CreditCard,
  Calendar,
  Filter,
  X,
} from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  paymentRef: string | null;
  itemType: string;
  itemId: string | null;
  description: string;
  metadata: string | null;
  paidAt: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Revenue {
  totalRevenue: number;
  thisMonthRevenue: number;
  thisWeekRevenue: number;
  todayRevenue: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  byType: {
    SUBSCRIPTION: number;
    CREDITS: number;
    FEATURED_BOOST: number;
  };
}

const PAYMENT_STATUS_OPTIONS = ["all", "COMPLETED", "PENDING", "FAILED", "REFUNDED"];
const METHOD_OPTIONS = ["all", "MPESA", "CARD", "BANK_TRANSFER", "PAYPAL"];
const TYPE_OPTIONS = ["all", "SUBSCRIPTION", "CREDITS", "FEATURED_BOOST"];
const PAGE_SIZE = 20;

const statusColor = (status: string) => {
  switch (status) {
    case "COMPLETED": case "PAID": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "PENDING": return "bg-amber-100 text-amber-700 border-amber-200";
    case "FAILED": return "bg-red-100 text-red-700 border-red-200";
    case "REFUNDED": return "bg-sky-100 text-sky-700 border-sky-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (methodFilter && methodFilter !== "all") params.set("paymentMethod", methodFilter);
    if (typeFilter && typeFilter !== "all") params.set("itemType", typeFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    try {
      const res = await fetch(`/api/admin/payments?${params}`);
      const data = await res.json();
      setPayments(data.payments || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, methodFilter, typeFilter, dateFrom, dateTo]);

  const fetchRevenue = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/payments/revenue");
      const data = await res.json();
      setRevenue(data);
    } catch {
      // silent fail for revenue
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const clearFilters = () => {
    setStatusFilter("all");
    setMethodFilter("all");
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasActiveFilters = statusFilter !== "all" || methodFilter !== "all" || typeFilter !== "all" || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payments & Revenue</h1>
          <p className="text-muted-foreground">Track payments and revenue analytics</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9"
            value={""}
            onChange={() => {}}
          />
        </div>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{revenue ? formatKES(revenue.totalRevenue) : "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {revenue?.completedPayments || 0} completed payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{revenue ? formatKES(revenue.thisMonthRevenue) : "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {revenue?.pendingPayments || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">This Week</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{revenue ? formatKES(revenue.thisWeekRevenue) : "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {revenue?.failedPayments || 0} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Today</CardTitle>
            <Receipt className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{revenue ? formatKES(revenue.todayRevenue) : "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Type Breakdown */}
      {revenue && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subscriptions</p>
                  <p className="text-lg font-bold">{formatKES(revenue.byType.SUBSCRIPTION)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credits</p>
                  <p className="text-lg font-bold">{formatKES(revenue.byType.CREDITS)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Featured Boosts</p>
                  <p className="text-lg font-bold">{formatKES(revenue.byType.FEATURED_BOOST)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s === "all" ? "All Status" : s.charAt(0) + s.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                {METHOD_OPTIONS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m === "all" ? "All Methods" : m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t === "all" ? "All Types" : t.charAt(0) + t.slice(1).toLowerCase().replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              className="w-[150px]"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              placeholder="From"
            />
            <Input
              type="date"
              className="w-[150px]"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              placeholder="To"
            />

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="hidden md:table-cell">Company</TableHead>
                <TableHead className="hidden lg:table-cell">User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Method</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="hidden lg:table-cell">Ref</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}>
                      <Skeleton className="h-12 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    <Receipt className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No payments found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <p className="text-sm">{formatDate(payment.createdAt)}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(payment.createdAt)}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[150px]">{payment.company.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-sm truncate max-w-[130px]">{payment.user.name || "N/A"}</p>
                          <p className="text-xs text-muted-foreground truncate">{payment.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold">{formatKES(payment.amount)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium ${statusColor(payment.status)}`}
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {payment.paymentMethod}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary" className="text-[10px]">
                        {payment.itemType.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono">
                      {payment.paymentRef ? (
                        <span className="truncate max-w-[120px] block">{payment.paymentRef}</span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}&ndash;{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Payment Detail Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payment Details
            </DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-5">
                {/* Amount & Status */}
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold">{formatKES(selectedPayment.amount)}</p>
                  <Badge
                    variant="outline"
                    className={`font-medium ${statusColor(selectedPayment.status)}`}
                  >
                    {selectedPayment.status}
                  </Badge>
                </div>

                <Separator />

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Payment ID</p>
                    <p className="font-mono text-xs mt-0.5">{selectedPayment.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Reference</p>
                    <p className="font-mono text-xs mt-0.5">{selectedPayment.paymentRef || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Method</p>
                    <p className="mt-0.5">{selectedPayment.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="mt-0.5">{selectedPayment.itemType.replace("_", " ")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Currency</p>
                    <p className="mt-0.5">{selectedPayment.currency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="mt-0.5">{formatDateTime(selectedPayment.createdAt)}</p>
                  </div>
                  {selectedPayment.paidAt && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Paid At</p>
                      <p className="mt-0.5">{formatDateTime(selectedPayment.paidAt)}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Company */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Company
                  </h3>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{selectedPayment.company.name}</span>
                  </div>
                </div>

                {/* User */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    User
                  </h3>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{selectedPayment.user.name || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">{selectedPayment.user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedPayment.description && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Description
                    </h3>
                    <p className="text-sm bg-muted/50 rounded-lg p-3">{selectedPayment.description}</p>
                  </div>
                )}

                {/* Metadata */}
                {selectedPayment.metadata && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Metadata
                    </h3>
                    <pre className="text-xs bg-muted/50 rounded-lg p-3 whitespace-pre-wrap overflow-auto max-h-40">
                      {(() => {
                        try { return JSON.stringify(JSON.parse(selectedPayment.metadata), null, 2); }
                        catch { return selectedPayment.metadata; }
                      })()}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
