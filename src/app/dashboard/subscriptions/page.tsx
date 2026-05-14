"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatKES, formatDate, formatRelativeTime } from "@/lib/format";
import { toast } from "sonner";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  Building2,
  Calendar,
  Clock,
  Plus,
  ArrowUpRight,
} from "lucide-react";

interface Subscription {
  id: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  plan: {
    id: string;
    name: string;
    slug: string;
    priceMonthly: number;
    priceYearly: number;
  };
}

interface SubscriptionDetail extends Subscription {
  company: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    industry: string | null;
    location: string | null;
  };
  plan: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    priceMonthly: number;
    priceYearly: number;
    currency: string;
  };
  payments: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: string;
    paidAt: string | null;
    createdAt: string;
  }[];
}

const STATUS_OPTIONS = ["all", "ACTIVE", "CANCELLED", "EXPIRED", "TRIAL"];
const PAGE_SIZE = 20;

const statusColor = (status: string) => {
  switch (status) {
    case "ACTIVE": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
    case "EXPIRED": return "bg-gray-100 text-gray-700 border-gray-200";
    case "TRIAL": return "bg-amber-100 text-amber-700 border-amber-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const paymentStatusColor = (status: string) => {
  switch (status) {
    case "COMPLETED": case "PAID": return "bg-emerald-100 text-emerald-700";
    case "PENDING": return "bg-amber-100 text-amber-700";
    case "FAILED": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<SubscriptionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [extendDays, setExtendDays] = useState("");
  const [extendSubId, setExtendSubId] = useState<string | null>(null);
  const [extending, setExtending] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

    try {
      const res = await fetch(`/api/admin/subscriptions?${params}`);
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to fetch subscriptions");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleViewDetail = async (sub: Subscription) => {
    setDetailLoading(true);
    setSelectedSub(sub as SubscriptionDetail);
    try {
      const res = await fetch(`/api/admin/subscriptions/${sub.id}`);
      const data = await res.json();
      setSelectedSub(data);
    } catch {
      toast.error("Failed to load subscription detail");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (subId: string, newStatus: string) => {
    try {
      await fetch(`/api/admin/subscriptions/${subId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`Subscription ${newStatus.toLowerCase()}`);
      fetchSubscriptions();
      if (selectedSub?.id === subId) {
        handleViewDetail(selectedSub);
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleExtend = async () => {
    if (!extendSubId || !extendDays || parseInt(extendDays) <= 0) return;
    setExtending(true);
    try {
      await fetch(`/api/admin/subscriptions/${extendSubId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extendDays: parseInt(extendDays) }),
      });
      toast.success(`Subscription extended by ${extendDays} days`);
      setExtendDialogOpen(false);
      setExtendDays("");
      setExtendSubId(null);
      fetchSubscriptions();
      if (selectedSub?.id === extendSubId) {
        handleViewDetail(selectedSub);
      }
    } catch {
      toast.error("Failed to extend subscription");
    } finally {
      setExtending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">Manage company subscriptions and billing</p>
        </div>
      </div>

      {/* Status Filters */}
      <Tabs
        value={statusFilter}
        onValueChange={(v) => {
          setStatusFilter(v);
          setPage(1);
        }}
      >
        <TabsList>
          {STATUS_OPTIONS.map((s) => (
            <TabsTrigger key={s} value={s}>
              {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Cycle</TableHead>
                <TableHead className="hidden lg:table-cell">Period End</TableHead>
                <TableHead className="hidden sm:table-cell">Created</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-12 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No subscriptions found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{sub.company.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{sub.plan.name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium ${statusColor(sub.status)}`}
                      >
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {sub.billingCycle}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {formatDate(sub.currentPeriodEnd)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {formatRelativeTime(sub.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleViewDetail(sub)}
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

      {/* Subscription Detail Dialog */}
      <Dialog open={!!selectedSub} onOpenChange={() => setSelectedSub(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Detail
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : selectedSub ? (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Company Info */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Company
                  </h3>
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-semibold">{selectedSub.company.name}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground mt-0.5">
                        {selectedSub.company.industry && <span>{selectedSub.company.industry}</span>}
                        {selectedSub.company.location && <span>{selectedSub.company.location}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Plan & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Plan</p>
                    <p className="font-medium">{selectedSub.plan.name}</p>
                    {selectedSub.plan.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedSub.plan.description}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge variant="outline" className={`font-medium ${statusColor(selectedSub.status)}`}>
                      {selectedSub.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Billing Cycle</p>
                    <span className="text-sm">{selectedSub.billingCycle}</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Price</p>
                    <span className="text-sm font-medium">
                      {selectedSub.billingCycle === "MONTHLY"
                        ? formatKES(selectedSub.plan.priceMonthly)
                        : formatKES(selectedSub.plan.priceYearly)}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Period Info */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Period
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Start:</span>
                      <span>{formatDate(selectedSub.currentPeriodStart)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">End:</span>
                      <span>{formatDate(selectedSub.currentPeriodEnd)}</span>
                    </div>
                    {selectedSub.cancelledAt && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <Clock className="h-4 w-4" />
                        <span>Cancelled: {formatDate(selectedSub.cancelledAt)}</span>
                      </div>
                    )}
                    {selectedSub.trialEndsAt && (
                      <div className="flex items-center gap-2 text-sm text-amber-600">
                        <Clock className="h-4 w-4" />
                        <span>Trial ends: {formatDate(selectedSub.trialEndsAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {selectedSub.status !== "CANCELLED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleStatusChange(selectedSub.id, "CANCELLED")}
                    >
                      Cancel Subscription
                    </Button>
                  )}
                  {selectedSub.status !== "ACTIVE" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      onClick={() => handleStatusChange(selectedSub.id, "ACTIVE")}
                    >
                      Activate
                    </Button>
                  )}
                  {selectedSub.status === "ACTIVE" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setExtendSubId(selectedSub.id);
                        setExtendDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Extend Period
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Payment History */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Payment History ({selectedSub.payments?.length || 0})
                  </h3>
                  {selectedSub.payments?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No payments recorded</p>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left px-3 py-2 font-medium">Date</th>
                            <th className="text-left px-3 py-2 font-medium">Amount</th>
                            <th className="text-left px-3 py-2 font-medium">Status</th>
                            <th className="text-left px-3 py-2 font-medium">Method</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSub.payments.map((payment) => (
                            <tr key={payment.id} className="border-t">
                              <td className="px-3 py-2 text-muted-foreground">
                                {formatDate(payment.createdAt)}
                              </td>
                              <td className="px-3 py-2 font-medium">{formatKES(payment.amount)}</td>
                              <td className="px-3 py-2">
                                <Badge variant="outline" className={`text-[10px] ${paymentStatusColor(payment.status)}`}>
                                  {payment.status}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">{payment.paymentMethod}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Extend Subscription Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5" />
              Extend Subscription
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add extra days to the subscription&apos;s current period end date.
            </p>
            <div className="space-y-2">
              <Label>Number of Days</Label>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 30"
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExtend}
              disabled={!extendDays || parseInt(extendDays) <= 0 || extending}
            >
              {extending ? "Extending..." : "Extend Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
