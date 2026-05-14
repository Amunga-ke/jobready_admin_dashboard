"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { toast } from "sonner";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  ExternalLink,
  Mail,
  Building2,
  Calendar,
  MapPin,
  Briefcase,
  User,
  Eye,
} from "lucide-react";

interface Application {
  id: string;
  status: string;
  coverLetter: string | null;
  cvUrl: string | null;
  score: number | null;
  appliedAt: string;
  createdAt: string;
  notes: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    county: string | null;
  };
  listing: {
    id: string;
    title: string;
    slug: string;
    employmentType: string;
    company: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

const STATUS_OPTIONS = ["all", "APPLIED", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED", "HIRED"];
const PAGE_SIZE = 20;

const statusColor = (status: string) => {
  switch (status) {
    case "APPLIED": return "bg-sky-100 text-sky-700 border-sky-200";
    case "SHORTLISTED": return "bg-violet-100 text-violet-700 border-violet-200";
    case "INTERVIEW": return "bg-amber-100 text-amber-700 border-amber-200";
    case "OFFERED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "REJECTED": return "bg-red-100 text-red-700 border-red-200";
    case "HIRED": return "bg-green-100 text-green-700 border-green-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (search) params.set("q", search);
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

    try {
      const res = await fetch(`/api/admin/applications?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setApplications(data.applications || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-muted-foreground">Review and manage job applications</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applicants, listings..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
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
        <TabsList className="flex-wrap h-auto gap-1">
          {STATUS_OPTIONS.map((s) => (
            <TabsTrigger key={s} value={s} className="text-xs capitalize">
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
                <TableHead>Applicant</TableHead>
                <TableHead className="hidden md:table-cell">Listing</TableHead>
                <TableHead className="hidden lg:table-cell">Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Applied</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-12 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No applications found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow
                    key={app.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedApp(app)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={app.user.avatarUrl || undefined} />
                          <AvatarFallback className="text-xs bg-slate-100 text-slate-600">
                            {(app.user.name || "U").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{app.user.name || "N/A"}</p>
                          <p className="text-xs text-muted-foreground truncate">{app.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <p className="text-sm font-medium truncate max-w-[200px]">{app.listing.title}</p>
                      <p className="text-xs text-muted-foreground">{app.listing.employmentType}</p>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{app.listing.company.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium ${statusColor(app.status)}`}
                      >
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {formatRelativeTime(app.appliedAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApp(app);
                        }}
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
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Application Details
            </DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Applicant Info */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Applicant
                  </h3>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={selectedApp.user.avatarUrl || undefined} />
                      <AvatarFallback className="text-sm bg-slate-100 text-slate-600">
                        {(selectedApp.user.name || "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="font-semibold text-lg">{selectedApp.user.name || "N/A"}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {selectedApp.user.email}
                        </span>
                        {selectedApp.user.county && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {selectedApp.user.county}
                          </span>
                        )}
                      </div>
                      {selectedApp.cvUrl && (
                        <a
                          href={selectedApp.cvUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View CV
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Listing Info */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Listing
                  </h3>
                  <div className="space-y-2">
                    <p className="font-medium text-base">{selectedApp.listing.title}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {selectedApp.listing.company.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {selectedApp.listing.employmentType}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Applied {formatDate(selectedApp.appliedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Status & Score */}
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge
                      variant="outline"
                      className={`font-medium ${statusColor(selectedApp.status)}`}
                    >
                      {selectedApp.status}
                    </Badge>
                  </div>
                  {selectedApp.score !== null && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Score</p>
                      <Badge variant="secondary" className="font-medium">
                        {selectedApp.score}/100
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Cover Letter */}
                {selectedApp.coverLetter && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Cover Letter
                      </h3>
                      <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedApp.coverLetter}
                      </div>
                    </div>
                  </>
                )}

                {/* Notes */}
                {selectedApp.notes && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Internal Notes
                      </h3>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm whitespace-pre-wrap">
                        {selectedApp.notes}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
