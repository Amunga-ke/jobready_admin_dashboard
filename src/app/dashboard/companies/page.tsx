"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatRelativeTime, formatDate, formatDateTime, formatKES } from "@/lib/format";
import { toast } from "sonner";
import {
  Search, MoreHorizontal, Eye, ShieldCheck, ShieldX, Coins,
  ChevronLeft, ChevronRight, Building2, Briefcase, Users, Star
} from "lucide-react";

interface CompanyListItem {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  verified: boolean;
  orgType: string;
  industry: string | null;
  county: string | null;
  location: string | null;
  country: string;
  createdAt: string;
  _count: { listings: number; teamMembers: number };
  subscriptions: { id: string; status: string; plan: { name: string } }[];
}

interface CompanyDetail extends CompanyListItem {
  description: string | null;
  website: string | null;
  employerProfiles: {
    id: string;
    role: string;
    isVerified: boolean;
    createdAt: string;
    user: { id: string; name: string; email: string; avatarUrl: string | null };
  }[];
  teamMembers: {
    id: string;
    role: string;
    isActive: boolean;
    user: { id: string; name: string; email: string; avatarUrl: string | null };
  }[];
  subscriptions: {
    id: string;
    status: string;
    billingCycle: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    plan: { id: string; name: string; slug: string; priceMonthly: number; priceYearly: number };
  }[];
  jobCredit: {
    id: string;
    balance: number;
    totalPurchased: number;
    totalUsed: number;
  } | null;
  _count: { listings: number; payments: number; featuredBoosts: number };
}

const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Education", "Manufacturing",
  "Retail", "Agriculture", "Construction", "Energy", "Media",
  "Transport", "Real Estate", "Consulting", "Government", "NGO", "Other",
];

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [verified, setVerified] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [creditsDialog, setCreditsDialog] = useState<CompanyListItem | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDescription, setCreditDescription] = useState("");
  const [creditLoading, setCreditLoading] = useState(false);
  const limit = 20;

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (verified) params.set("verified", verified);
    if (industry) params.set("industry", industry);

    try {
      const res = await fetch(`/api/admin/companies?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCompanies(data.companies || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, verified, industry, limit]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const totalPages = Math.ceil(total / limit);

  const fetchCompanyDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/companies/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSelectedCompany(data);
    } catch {
      toast.error("Failed to fetch company details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleVerify = async (company: CompanyListItem) => {
    try {
      const res = await fetch(`/api/admin/companies/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: !company.verified }),
      });
      if (!res.ok) throw new Error();
      toast.success(company.verified ? "Company unverified" : "Company verified");
      fetchCompanies();
    } catch {
      toast.error("Failed to update verification");
    }
  };

  const handleCreditAdjust = async () => {
    if (!creditsDialog) return;
    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount === 0) {
      toast.error("Please enter a valid non-zero amount");
      return;
    }
    if (!creditDescription.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    setCreditLoading(true);
    try {
      const res = await fetch(`/api/admin/companies/${creditsDialog.id}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, description: creditDescription }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(`Credits adjusted. New balance: ${data.newBalance}`);
      setCreditsDialog(null);
      setCreditAmount("");
      setCreditDescription("");
      fetchCompanies();
    } catch {
      toast.error("Failed to adjust credits");
    } finally {
      setCreditLoading(false);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Companies</h1>
          <p className="text-muted-foreground">Manage registered companies</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={verified} onValueChange={(v) => { setVerified(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Verified" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Verified</SelectItem>
              <SelectItem value="false">Unverified</SelectItem>
            </SelectContent>
          </Select>
          <Select value={industry} onValueChange={(v) => { setIndustry(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-40 hidden sm:block">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {INDUSTRIES.map((ind) => (
                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead className="hidden md:table-cell">Industry</TableHead>
                  <TableHead className="hidden lg:table-cell">County</TableHead>
                  <TableHead className="text-center">Listings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Plan</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}><Skeleton className="h-12 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : companies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">No companies found</p>
                      <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 rounded-lg">
                            {company.logo && <AvatarImage src={company.logo} alt={company.name} />}
                            <AvatarFallback className="rounded-lg bg-slate-100 text-slate-600 text-xs">
                              {company.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{company.name}</p>
                            <p className="text-xs text-muted-foreground">{company.orgType}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{company.industry || "—"}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{company.county || "—"}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium">{company._count.listings}</span>
                      </TableCell>
                      <TableCell>
                        {company.verified ? (
                          <Badge className="text-[10px] bg-green-100 text-green-700" variant="outline">
                            <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                          </Badge>
                        ) : (
                          <Badge className="text-[10px] bg-gray-100 text-gray-700" variant="outline">
                            <ShieldX className="h-3 w-3 mr-1" /> Unverified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {company.subscriptions[0] ? (
                          <Badge variant="secondary" className="text-[10px]">{company.subscriptions[0].plan.name}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Free</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {formatRelativeTime(company.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => fetchCompanyDetail(company.id)}>
                              <Eye className="h-4 w-4 mr-2" />View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleVerify(company)}>
                              {company.verified ? (
                                <><ShieldX className="h-4 w-4 mr-2" />Unverify</>
                              ) : (
                                <><ShieldCheck className="h-4 w-4 mr-2" />Verify</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setCreditsDialog(company); setCreditAmount(""); setCreditDescription(""); }}>
                              <Coins className="h-4 w-4 mr-2" />Manage Credits
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {getPageNumbers().map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="px-2 text-muted-foreground">…</span>
              ) : (
                <Button
                  key={p}
                  variant={page === p ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(p as number)}
                >
                  {p}
                </Button>
              )
            )}
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Company Detail Dialog */}
      <Dialog open={!!selectedCompany || detailLoading} onOpenChange={() => setSelectedCompany(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Company Details</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : selectedCompany && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 rounded-lg">
                  {selectedCompany.logo && <AvatarImage src={selectedCompany.logo} alt={selectedCompany.name} />}
                  <AvatarFallback className="rounded-lg bg-slate-100 text-slate-600 text-lg">
                    {selectedCompany.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{selectedCompany.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCompany.industry || "No industry"} · {selectedCompany.orgType}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedCompany.verified ? (
                      <Badge className="text-[10px] bg-green-100 text-green-700" variant="outline">
                        <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    ) : (
                      <Badge className="text-[10px] bg-gray-100 text-gray-700" variant="outline">
                        <ShieldX className="h-3 w-3 mr-1" /> Unverified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {selectedCompany.description && (
                <p className="text-sm text-muted-foreground">{selectedCompany.description}</p>
              )}

              <Separator />

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Location</p>
                  <p className="font-medium">{[selectedCompany.county, selectedCompany.location].filter(Boolean).join(", ") || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Country</p>
                  <p className="font-medium">{selectedCompany.country}</p>
                </div>
                {selectedCompany.website && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Website</p>
                    <p className="font-medium text-blue-600 truncate">{selectedCompany.website}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs">Created</p>
                  <p className="font-medium">{formatDate(selectedCompany.createdAt)}</p>
                </div>
              </div>

              {/* Stats */}
              <Separator />
              <div>
                <p className="text-sm font-semibold mb-2">Stats</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-lg bg-slate-50">
                    <Briefcase className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-lg font-bold">{selectedCompany._count.listings}</p>
                    <p className="text-[10px] text-muted-foreground">Listings</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-slate-50">
                    <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-lg font-bold">{selectedCompany.teamMembers.length}</p>
                    <p className="text-[10px] text-muted-foreground">Members</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-slate-50">
                    <Coins className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-lg font-bold">{selectedCompany.jobCredit?.balance ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">Credits</p>
                  </div>
                </div>
              </div>

              {/* Subscription */}
              {selectedCompany.subscriptions[0] && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-2">Subscription</p>
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{selectedCompany.subscriptions[0].plan.name}</p>
                            <p className="text-xs text-muted-foreground">{selectedCompany.subscriptions[0].billingCycle}</p>
                          </div>
                          <Badge
                            variant={selectedCompany.subscriptions[0].status === "ACTIVE" ? "default" : "outline"}
                            className="text-[10px]"
                          >
                            {selectedCompany.subscriptions[0].status}
                          </Badge>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Period: {formatDate(selectedCompany.subscriptions[0].currentPeriodStart)} — {formatDate(selectedCompany.subscriptions[0].currentPeriodEnd)}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Price: {formatKES(selectedCompany.subscriptions[0].billingCycle === "YEARLY" ? selectedCompany.subscriptions[0].plan.priceYearly : selectedCompany.subscriptions[0].plan.priceMonthly)}/
                          {selectedCompany.subscriptions[0].billingCycle === "YEARLY" ? "year" : "month"}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {/* Credits */}
              {selectedCompany.jobCredit && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-2">Credits</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Balance</p>
                        <p className="font-bold text-green-600">{selectedCompany.jobCredit.balance}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Purchased</p>
                        <p className="font-medium">{selectedCompany.jobCredit.totalPurchased}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Used</p>
                        <p className="font-medium">{selectedCompany.jobCredit.totalUsed}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Team Members */}
              {selectedCompany.teamMembers.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-2">Team Members ({selectedCompany.teamMembers.length})</p>
                    <div className="space-y-2">
                      {selectedCompany.teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {member.user.avatarUrl && <AvatarImage src={member.user.avatarUrl} alt={member.user.name} />}
                            <AvatarFallback className="text-[10px] bg-slate-100">{member.user.name.slice(0, 1)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{member.user.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{member.user.email}</p>
                          </div>
                          <Badge variant={member.isActive ? "default" : "outline"} className="text-[9px]">
                            {member.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Credit Adjustment Dialog */}
      <Dialog open={!!creditsDialog} onOpenChange={() => setCreditsDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Credits</DialogTitle>
            <DialogDescription>
              Adjust credits for <span className="font-medium">{creditsDialog?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 text-sm">
              <p className="text-muted-foreground">Current Listings: <span className="font-medium text-foreground">{creditsDialog?._count.listings || 0}</span></p>
              <p className="text-muted-foreground">Team Members: <span className="font-medium text-foreground">{creditsDialog?._count.teamMembers || 0}</span></p>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreditAmount(String(Math.abs(parseInt(creditAmount) || 0)))}
                >
                  +
                </Button>
                <Input
                  type="number"
                  placeholder="Enter amount (use - for deduction)"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreditAmount(String(-Math.abs(parseInt(creditAmount) || 0)))}
                >
                  −
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Positive to add credits, negative to deduct
              </p>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                placeholder="e.g., Welcome bonus, Correction for overcharge..."
                value={creditDescription}
                onChange={(e) => setCreditDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditsDialog(null)}>Cancel</Button>
            <Button onClick={handleCreditAdjust} disabled={creditLoading}>
              {creditLoading ? "Adjusting..." : "Adjust Credits"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
