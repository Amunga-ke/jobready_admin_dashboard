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
import { formatRelativeTime, formatDate, formatKES } from "@/lib/format";
import { toast } from "sonner";
import {
  Search, MoreHorizontal, Eye, Star, StarOff, XCircle, RefreshCw,
  ChevronLeft, ChevronRight, Briefcase, FileText, Building2, MapPin, Clock
} from "lucide-react";

interface ListingListItem {
  id: string;
  title: string;
  status: string;
  featured: boolean;
  employmentType: string;
  workMode: string;
  county: string;
  createdAt: string;
  deadline: string | null;
  viewCount: number;
  applyCount: number;
  company: { id: string; name: string; logo: string | null };
  category: { id: string; name: string } | null;
  _count: { applications: number };
}

interface ListingDetail extends ListingListItem {
  slug: string;
  description: string;
  listingType: string;
  town: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: string | null;
  experienceLevel: string;
  applicationUrl: string | null;
  applyEmail: string | null;
  subcategory: { id: string; name: string } | null;
  tags: { tag: { id: string; name: string } }[];
  featuredBoosts: {
    id: string;
    status: string;
    startedAt: string | null;
    expiresAt: string | null;
    durationDays: number;
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  DRAFT: "bg-gray-100 text-gray-700",
  CLOSED: "bg-red-100 text-red-700",
  EXPIRED: "bg-orange-100 text-orange-700",
  PENDING: "bg-yellow-100 text-yellow-700",
};

const STATUS_LIST = [
  { value: "", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Draft" },
  { value: "CLOSED", label: "Closed" },
  { value: "EXPIRED", label: "Expired" },
  { value: "PENDING", label: "Pending" },
];

const COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret",
  "Kiambu", "Machakos", "Nyeri", "Meru", "Tharaka Nithi",
  "Embu", "Kitui", "Makueni", "Kajiado", "Laikipia",
  "Narok", "Baringo", "Uasin Gishu", "Kakamega", "Bungoma",
  "Trans Nzoia", "Kisii", "Nyamira", "Homa Bay", "Migori",
  "Siaya", "Busia", "Turkana", "West Pokot", "Samburu",
  "Isiolo", "Marsabit", "Mandera", "Wajir", "Garissa",
  "Lamu", "Tana River", "Kilifi", "Kwale", "Taita Taveta",
  "Vihiga", "Nyandarua", "Murang'a", "Kirinyaga", "Kericho",
  "Bomet", "Nandi", "Elgeyo Marakwet", "Pokot", "Other",
];

export default function ListingsPage() {
  const [listings, setListings] = useState<ListingListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [featured, setFeatured] = useState("");
  const [county, setCounty] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<ListingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusDialog, setStatusDialog] = useState<ListingListItem | null>(null);
  const [newStatus, setNewStatus] = useState("");
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

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (status) params.set("status", status);
    if (featured) params.set("featured", featured);
    if (county) params.set("county", county);

    try {
      const res = await fetch(`/api/admin/listings?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setListings(data.listings || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, featured, county, limit]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const totalPages = Math.ceil(total / limit);

  const fetchListingDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/listings/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSelectedListing(data);
    } catch {
      toast.error("Failed to fetch listing details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleFeatured = async (listing: ListingListItem) => {
    try {
      const res = await fetch(`/api/admin/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !listing.featured }),
      });
      if (!res.ok) throw new Error();
      toast.success(listing.featured ? "Removed from featured" : "Added to featured");
      fetchListings();
    } catch {
      toast.error("Failed to toggle featured");
    }
  };

  const handleCloseListing = async (listing: ListingListItem) => {
    try {
      const res = await fetch(`/api/admin/listings/${listing.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Listing closed");
      fetchListings();
    } catch {
      toast.error("Failed to close listing");
    }
  };

  const handleStatusChange = async () => {
    if (!statusDialog || !newStatus) return;
    try {
      const res = await fetch(`/api/admin/listings/${statusDialog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Status changed to ${newStatus}`);
      setStatusDialog(null);
      setNewStatus("");
      fetchListings();
    } catch {
      toast.error("Failed to change status");
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
          <h1 className="text-2xl font-bold">Listings</h1>
          <p className="text-muted-foreground">Manage all job listings</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search listings..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={(v) => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_LIST.map((s) => (
              <SelectItem key={s.value || "all"} value={s.value || "all"}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={featured} onValueChange={(v) => { setFeatured(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Featured" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Featured</SelectItem>
            <SelectItem value="false">Not Featured</SelectItem>
          </SelectContent>
        </Select>

        <Select value={county} onValueChange={(v) => { setCounty(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="County" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Counties</SelectItem>
            {COUNTIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(status || featured || county || debouncedSearch) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatus("");
              setFeatured("");
              setCounty("");
              setSearch("");
              setDebouncedSearch("");
              setPage(1);
            }}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Company</TableHead>
                  <TableHead className="hidden lg:table-cell">Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">Apps</TableHead>
                  <TableHead className="text-center">Featured</TableHead>
                  <TableHead className="hidden lg:table-cell">Posted</TableHead>
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
                ) : listings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">No listings found</p>
                      <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  listings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[250px]">{listing.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">{listing.employmentType}</span>
                            <span className="text-[10px] text-muted-foreground">·</span>
                            <span className="text-[10px] text-muted-foreground">{listing.workMode}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {listing.company.logo && <AvatarImage src={listing.company.logo} alt={listing.company.name} />}
                            <AvatarFallback className="text-[10px] bg-slate-100">
                              {listing.company.name.slice(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate max-w-[150px]">{listing.company.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {listing.category?.name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${STATUS_COLORS[listing.status] || "bg-gray-100 text-gray-700"}`} variant="outline">
                          {listing.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center hidden sm:table-cell">
                        <span className="text-sm font-medium">{listing._count.applications}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {listing.featured ? (
                          <Star className="h-4 w-4 text-amber-500 mx-auto fill-amber-500" />
                        ) : (
                          <Star className="h-4 w-4 text-gray-300 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {formatRelativeTime(listing.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => fetchListingDetail(listing.id)}>
                              <Eye className="h-4 w-4 mr-2" />View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleFeatured(listing)}>
                              {listing.featured ? (
                                <><StarOff className="h-4 w-4 mr-2" />Remove Featured</>
                              ) : (
                                <><Star className="h-4 w-4 mr-2" />Make Featured</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setStatusDialog(listing); setNewStatus(listing.status); }}>
                              <RefreshCw className="h-4 w-4 mr-2" />Change Status
                            </DropdownMenuItem>
                            {listing.status !== "CLOSED" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleCloseListing(listing)} className="text-red-600">
                                  <XCircle className="h-4 w-4 mr-2" />Close Listing
                                </DropdownMenuItem>
                              </>
                            )}
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

      {/* Listing Detail Dialog */}
      <Dialog open={!!selectedListing || detailLoading} onOpenChange={() => setSelectedListing(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Listing Details</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : selectedListing && (
            <div className="space-y-4">
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-lg leading-tight">{selectedListing.title}</h3>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={`text-[10px] ${STATUS_COLORS[selectedListing.status] || ""}`} variant="outline">
                      {selectedListing.status}
                    </Badge>
                    {selectedListing.featured && (
                      <Badge className="text-[10px] bg-amber-100 text-amber-700" variant="outline">
                        <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" /> Featured
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{selectedListing.employmentType}</span>
                  <span>·</span>
                  <span>{selectedListing.experienceLevel}</span>
                  <span>·</span>
                  <span>{selectedListing.workMode}</span>
                </div>
              </div>

              {/* Company */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <Avatar className="h-10 w-10 rounded-lg">
                  {selectedListing.company.logo && <AvatarImage src={selectedListing.company.logo} alt={selectedListing.company.name} />}
                  <AvatarFallback className="rounded-lg bg-slate-200 text-slate-600">
                    {selectedListing.company.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{selectedListing.company.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[selectedListing.county, selectedListing.company.county].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedListing.category && (
                  <div>
                    <p className="text-muted-foreground text-xs">Category</p>
                    <p className="font-medium">{selectedListing.category.name}</p>
                  </div>
                )}
                {selectedListing.subcategory && (
                  <div>
                    <p className="text-muted-foreground text-xs">Subcategory</p>
                    <p className="font-medium">{selectedListing.subcategory.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs">Location</p>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {[selectedListing.town, selectedListing.county].filter(Boolean).join(", ") || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Salary</p>
                  <p className="font-medium">
                    {selectedListing.salaryMin || selectedListing.salaryMax
                      ? `${formatKES(selectedListing.salaryMin || 0)}${selectedListing.salaryMax ? ` – ${formatKES(selectedListing.salaryMax)}` : ""}${selectedListing.salaryPeriod ? `/${selectedListing.salaryPeriod}` : ""}`
                      : "Not specified"
                    }
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Deadline</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {selectedListing.deadline ? formatDate(selectedListing.deadline) : "No deadline"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Posted</p>
                  <p className="font-medium">{formatDate(selectedListing.createdAt)}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-lg bg-slate-50">
                  <FileText className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-lg font-bold">{selectedListing._count.applications}</p>
                  <p className="text-[10px] text-muted-foreground">Applications</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-slate-50">
                  <Star className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-lg font-bold">{selectedListing.featuredBoosts.length}</p>
                  <p className="text-[10px] text-muted-foreground">Boosts</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-slate-50">
                  <Eye className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-lg font-bold">{selectedListing.viewCount}</p>
                  <p className="text-[10px] text-muted-foreground">Views</p>
                </div>
              </div>

              {/* Featured Boosts */}
              {selectedListing.featuredBoosts.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-2">Featured Boosts</p>
                    <div className="space-y-2">
                      {selectedListing.featuredBoosts.map((boost) => (
                        <div key={boost.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-slate-50">
                          <div>
                            <Badge className={`text-[10px] ${STATUS_COLORS[boost.status] || "bg-gray-100 text-gray-700"}`} variant="outline">
                              {boost.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-2">{boost.durationDays} days</span>
                          </div>
                          {boost.expiresAt && (
                            <span className="text-xs text-muted-foreground">
                              Expires {formatDate(boost.expiresAt)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Tags */}
              {selectedListing.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedListing.tags.map((t) => (
                        <Badge key={t.tag.id} variant="secondary" className="text-xs">{t.tag.name}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Description (truncated) */}
              {selectedListing.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-2">Description</p>
                    <p className="text-sm text-muted-foreground line-clamp-4">{selectedListing.description}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={!!statusDialog} onOpenChange={() => setStatusDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Listing Status</DialogTitle>
            <DialogDescription>
              Change status for &quot;{statusDialog?.title?.slice(0, 50)}{statusDialog && statusDialog.title.length > 50 ? "..." : ""}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(null)}>Cancel</Button>
            <Button onClick={handleStatusChange} disabled={newStatus === statusDialog?.status}>
              Change Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
