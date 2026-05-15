"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import {
  Brain,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────

interface CvMatchScore {
  id: string;
  candidateName: string;
  candidateEmail: string;
  listingTitle: string;
  companyName: string | null;
  score: number;
  skillsScore: number | null;
  experienceScore: number | null;
  educationScore: number | null;
  analysis: string | null;
  createdAt: string;
}

// ── Component ──────────────────────────────────────────────

export default function CvMatchingPage() {
  const [matches, setMatches] = useState<CvMatchScore[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<CvMatchScore | null>(
    null
  );

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

  // ── Fetch matches ──
  const fetchMatches = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (debouncedSearch) params.set("q", debouncedSearch);

    try {
      const res = await fetch(`/api/admin/cv-matches?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setMatches(Array.isArray(data.matches) ? data.matches : []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error("Failed to fetch CV match data");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, limit]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const totalPages = Math.ceil(total / limit);

  // ── Helpers ──
  const getScoreBadge = (score: number) => {
    if (score >= 70) return "bg-emerald-100 text-emerald-700";
    if (score >= 50) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  };

  // ── Stats ──
  const avgScore =
    matches.length > 0
      ? Math.round(matches.reduce((s, m) => s + m.score, 0) / matches.length)
      : 0;
  const highMatches = matches.filter((m) => m.score >= 70).length;
  const lowMatches = matches.filter((m) => m.score < 50).length;

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
          <h1 className="text-2xl font-bold">AI CV Matching</h1>
          <p className="text-muted-foreground">
            Monitor AI-powered CV-to-job match scores and analytics
          </p>
        </div>
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
                <Brain className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Matches</p>
                <p className="text-lg font-bold">
                  {total.toLocaleString()}
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
                <p className="text-xs text-muted-foreground">Average Score</p>
                <p className="text-lg font-bold">{avgScore}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  High Matches (&gt;70)
                </p>
                <p className="text-lg font-bold">{highMatches}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Low Matches (&lt;50)
                </p>
                <p className="text-lg font-bold">{lowMatches}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidate or job title..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Company
                  </TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    AI Analysis
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">Date</TableHead>
                  <TableHead className="w-12"></TableHead>
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
                ) : matches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">
                        No CV match data found
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Match scores will appear as candidates&apos; CVs are
                        analyzed against job listings
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  matches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {match.candidateName || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {match.candidateEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm truncate max-w-[180px]">
                          {match.listingTitle}
                        </p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {match.companyName || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs font-semibold ${getScoreBadge(match.score)}`}
                          variant="outline"
                        >
                          {match.score}%
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                          {match.analysis || "No analysis available"}
                        </p>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                        {formatDateTime(match.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedMatch(match)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
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

      {/* ── Match Detail Dialog ── */}
      <Dialog
        open={!!selectedMatch}
        onOpenChange={() => setSelectedMatch(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              CV Match Detail
            </DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-5">
                {/* Overall Score */}
                <div className="text-center">
                  <p
                    className={`text-5xl font-bold ${getScoreColor(selectedMatch.score)}`}
                  >
                    {selectedMatch.score}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Overall Match Score
                  </p>
                  {selectedMatch.score >= 70 ? (
                    <Badge
                      className="mt-2 bg-emerald-100 text-emerald-700"
                      variant="outline"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Strong Match
                    </Badge>
                  ) : selectedMatch.score >= 50 ? (
                    <Badge
                      className="mt-2 bg-amber-100 text-amber-700"
                      variant="outline"
                    >
                      <Target className="h-3 w-3 mr-1" />
                      Moderate Match
                    </Badge>
                  ) : (
                    <Badge
                      className="mt-2 bg-red-100 text-red-700"
                      variant="outline"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Weak Match
                    </Badge>
                  )}
                </div>

                <Separator />

                {/* Match Info */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Candidate</p>
                    <p className="text-sm font-medium">
                      {selectedMatch.candidateName || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedMatch.candidateEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Job Listing</p>
                    <p className="text-sm font-medium">
                      {selectedMatch.listingTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedMatch.companyName || "No company"}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Score Breakdown */}
                <div>
                  <p className="text-sm font-semibold mb-3">Score Breakdown</p>
                  <div className="space-y-3">
                    {[
                      {
                        label: "Skills",
                        value: selectedMatch.skillsScore,
                      },
                      {
                        label: "Experience",
                        value: selectedMatch.experienceScore,
                      },
                      {
                        label: "Education",
                        value: selectedMatch.educationScore,
                      },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.label}
                          </span>
                          <span
                            className={`font-semibold ${item.value != null ? getScoreColor(item.value) : "text-muted-foreground"}`}
                          >
                            {item.value != null ? `${item.value}%` : "N/A"}
                          </span>
                        </div>
                        {item.value != null && (
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.value >= 70
                                  ? "bg-emerald-500"
                                  : item.value >= 50
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${item.value}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Analysis */}
                {selectedMatch.analysis && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-semibold mb-2">
                        AI Analysis
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedMatch.analysis}
                      </p>
                    </div>
                  </>
                )}

                <Separator />

                <div className="text-xs text-muted-foreground text-center">
                  Scored on {formatDateTime(selectedMatch.createdAt)}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
