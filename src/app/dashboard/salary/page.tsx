"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  BarChart3,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileDown,
  Database,
  TrendingUp,
  ShieldCheck,
  Building2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────

interface SalarySubmission {
  id: string;
  jobTitle: string;
  companyName: string | null;
  industry: string | null;
  county: string | null;
  employmentType: string | null;
  experienceLevel: string | null;
  salaryAmount: number;
  salaryPeriod: string;
  source: string;
  isVerified: boolean;
  createdAt: string;
  userId: string;
  user: {
    name: string | null;
    email: string;
  } | null;
}

// ── Component ──────────────────────────────────────────────

export default function SalaryBenchmarkingPage() {
  const [submissions, setSubmissions] = useState<SalarySubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [industry, setIndustry] = useState("all");
  const [county, setCounty] = useState("all");
  const [experience, setExperience] = useState("all");
  const [loading, setLoading] = useState(true);

  const limit = 15;

  // ── Debounce search ──
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

  // ── Fetch submissions ──
  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (debouncedSearch) params.set("jobTitle", debouncedSearch);
    if (industry !== "all") params.set("industry", industry);
    if (county !== "all") params.set("county", county);
    if (experience !== "all") params.set("experienceLevel", experience);

    try {
      const res = await fetch(`/api/admin/salary?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSubmissions(Array.isArray(data.submissions) ? data.submissions : []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error("Failed to fetch salary data");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, industry, county, experience, limit]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const totalPages = Math.ceil(total / limit);

  // ── Verify submission ──
  const handleVerify = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/salary/${id}/verify`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      toast.success("Submission verified");
      fetchSubmissions();
    } catch {
      toast.error("Failed to verify submission");
    }
  };

  // ── Export placeholder ──
  const handleExport = () => {
    toast.info("Export feature coming soon");
  };

  // ── Helpers ──
  const getSourceBadge = (source: string) => {
    switch (source) {
      case "USER_SUBMITTED":
        return "bg-blue-100 text-blue-700";
      case "LISTING_EXTRACTED":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const normalizePeriod = (period: string, amount: number): number => {
    switch (period) {
      case "HOURLY":
        return Math.round(amount * 173.33);
      case "DAILY":
        return Math.round(amount * 21.67);
      case "WEEKLY":
        return Math.round(amount * 4.33);
      case "MONTHLY":
        return amount;
      case "ANNUALLY":
        return Math.round(amount / 12);
      default:
        return amount;
    }
  };

  // ── Stats ──
  const verifiedCount = submissions.filter((s) => s.isVerified).length;
  const avgSalary =
    submissions.length > 0
      ? Math.round(
          submissions.reduce(
            (sum, s) =>
              sum +
              normalizePeriod(
                s.salaryPeriod,
                s.salaryAmount
              ),
            0
          ) / submissions.length
        )
      : 0;

  // Top industry by submission count
  const industryCounts: Record<string, number> = {};
  submissions.forEach((s) => {
    if (s.industry) {
      industryCounts[s.industry] = (industryCounts[s.industry] || 0) + 1;
    }
  });
  const topIndustry = Object.entries(industryCounts).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0];

  // ── Pagination ──
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

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Salary Benchmarking Data</h1>
          <p className="text-muted-foreground">
            Manage salary submissions and benchmarking data
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <FileDown className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Stats */}
      {loading ? (
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
                <Database className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Total Submissions
                </p>
                <p className="text-lg font-bold">
                  {total.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Verified</p>
                <p className="text-lg font-bold">
                  {verifiedCount.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Avg Salary (mo.)
                </p>
                <p className="text-lg font-bold">{formatKES(avgSalary)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-violet-100 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Top Industry</p>
                <p className="text-lg font-bold truncate">
                  {topIndustry || "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search job title..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={industry}
          onValueChange={(v) => {
            setIndustry(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            <SelectItem value="Technology">Technology</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
            <SelectItem value="Healthcare">Healthcare</SelectItem>
            <SelectItem value="Education">Education</SelectItem>
            <SelectItem value="Manufacturing">Manufacturing</SelectItem>
            <SelectItem value="Retail">Retail</SelectItem>
            <SelectItem value="Construction">Construction</SelectItem>
            <SelectItem value="Agriculture">Agriculture</SelectItem>
            <SelectItem value="Government">Government</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={county}
          onValueChange={(v) => {
            setCounty(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="County" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Counties</SelectItem>
            <SelectItem value="Nairobi">Nairobi</SelectItem>
            <SelectItem value="Mombasa">Mombasa</SelectItem>
            <SelectItem value="Kisumu">Kisumu</SelectItem>
            <SelectItem value="Nakuru">Nakuru</SelectItem>
            <SelectItem value="Uasin Gishu">Uasin Gishu</SelectItem>
            <SelectItem value="Kiambu">Kiambu</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={experience}
          onValueChange={(v) => {
            setExperience(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Experience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="ENTRY">Entry Level</SelectItem>
            <SelectItem value="MID">Mid Level</SelectItem>
            <SelectItem value="SENIOR">Senior Level</SelectItem>
            <SelectItem value="EXECUTIVE">Executive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Company
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Industry
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    County
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden xl:table-cell">
                    Experience
                  </TableHead>
                  <TableHead>Salary (KES)</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Period
                  </TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="hidden xl:table-cell">Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={12}>
                        <Skeleton className="h-12 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-12">
                      <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">
                        No salary data found
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Submissions will appear as users or listings provide
                        salary information
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {sub.jobTitle}
                          </p>
                          {sub.user && (
                            <p className="text-xs text-muted-foreground truncate">
                              {sub.user.email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {sub.companyName || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {sub.industry || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {sub.county || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {sub.employmentType || "—"}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-sm">
                        {sub.experienceLevel || "—"}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold">
                          {formatKES(sub.salaryAmount)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {sub.salaryPeriod}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] ${getSourceBadge(sub.source)}`}
                          variant="outline"
                        >
                          {sub.source === "USER_SUBMITTED"
                            ? "User"
                            : "Listing"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sub.isVerified ? (
                          <Badge
                            variant="default"
                            className="text-[10px] bg-emerald-600"
                          >
                            Verified
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            onClick={() => handleVerify(sub.id)}
                          >
                            Verify
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                        {formatDate(sub.createdAt)}
                      </TableCell>
                      <TableCell></TableCell>
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
            Showing {(page - 1) * limit + 1}–
            {Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {getPageNumbers().map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="px-2 text-muted-foreground">
                  …
                </span>
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
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
