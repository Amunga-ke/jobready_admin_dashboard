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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import {
  ClipboardCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────

interface ResultListItem {
  id: string;
  candidateName: string;
  candidateEmail: string;
  testTitle: string;
  testCategory: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  timeTaken: number | null;
  completedAt: string;
  totalQuestions: number;
  correctAnswers: number;
}

interface ResultDetail {
  id: string;
  candidateName: string;
  candidateEmail: string;
  testTitle: string;
  testCategory: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  timeTaken: number | null;
  startedAt: string;
  completedAt: string;
  answers: {
    questionText: string;
    questionType: string;
    candidateAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string | null;
    points: number;
  }[];
}

// ── Component ──────────────────────────────────────────────

export default function TestResultsPage() {
  const [results, setResults] = useState<ResultListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [testId, setTestId] = useState("all");
  const [passedFilter, setPassedFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<ResultDetail | null>(
    null
  );
  const [detailLoading, setDetailLoading] = useState(false);

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

  // ── Fetch results ──
  const fetchResults = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (testId && testId !== "all") params.set("testId", testId);
    if (passedFilter !== "all") params.set("passed", passedFilter);

    try {
      const res = await fetch(`/api/admin/skill-tests/results?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setResults(Array.isArray(data.results) ? data.results : []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error("Failed to fetch test results");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, testId, passedFilter, limit]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const totalPages = Math.ceil(total / limit);

  // ── View detail ──
  const viewDetail = async (result: ResultListItem) => {
    setDetailLoading(true);
    setSelectedResult(null);
    try {
      const res = await fetch(`/api/admin/skill-tests/results?resultId=${result.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSelectedResult(data);
    } catch {
      toast.error("Failed to load result details");
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Helpers ──
  const getScoreBadge = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-100 text-emerald-700";
    if (percentage >= 60) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

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

  // ── Stats ──
  const passedCount = results.filter((r) => r.passed).length;
  const avgScore =
    results.length > 0
      ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
      : 0;

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Test Results</h1>
          <p className="text-muted-foreground">
            View candidate performance across all skill tests
          </p>
        </div>
      </div>

      {/* Stats */}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                <ClipboardCheck className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Results</p>
                <p className="text-lg font-bold">{total.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Trophy className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Score</p>
                <p className="text-lg font-bold">{avgScore}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Passed</p>
                <p className="text-lg font-bold">{passedCount}</p>
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
                  {results.length - passedCount}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by candidate name..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={passedFilter}
          onValueChange={(v) => {
            setPassedFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Passed" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="true">Passed</SelectItem>
            <SelectItem value="false">Failed</SelectItem>
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
                  <TableHead>Candidate</TableHead>
                  <TableHead className="hidden md:table-cell">Test</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Passed</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Time Taken
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Completed
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-12 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <ClipboardCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">
                        No test results found
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Results will appear once candidates complete tests
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((result) => (
                    <TableRow
                      key={result.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => viewDetail(result)}
                    >
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {result.candidateName || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {result.candidateEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="min-w-0">
                          <p className="text-sm truncate">
                            {result.testTitle}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {result.correctAnswers}/{result.totalQuestions}{" "}
                            correct
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs font-semibold ${getScoreBadge(result.percentage)}`}
                          variant="outline"
                        >
                          {result.percentage}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            result.passed ? "default" : "destructive"
                          }
                          className="text-[10px]"
                        >
                          {result.passed ? "Passed" : "Failed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(result.timeTaken)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {formatDateTime(result.completedAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            viewDetail(result);
                          }}
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

      {/* ── Result Detail Dialog ── */}
      <Dialog
        open={!!selectedResult || detailLoading}
        onOpenChange={() => setSelectedResult(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Result Breakdown
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : selectedResult ? (
            <ScrollArea className="max-h-[75vh] pr-4">
              <div className="space-y-6">
                {/* Summary */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-lg font-bold">
                        {selectedResult.candidateName || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedResult.candidateEmail}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          selectedResult.passed ? "default" : "destructive"
                        }
                        className="text-sm"
                      >
                        {selectedResult.passed
                          ? "PASSED"
                          : "FAILED"}
                      </Badge>
                      <Badge
                        className={`text-sm font-semibold ${getScoreBadge(selectedResult.percentage)}`}
                        variant="outline"
                      >
                        {selectedResult.percentage}%
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Test</p>
                      <p className="font-medium truncate">
                        {selectedResult.testTitle}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Score</p>
                      <p className="font-medium">
                        {selectedResult.score}/{selectedResult.maxScore}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        Time Taken
                      </p>
                      <p className="font-medium">
                        {formatTime(selectedResult.timeTaken)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        Completed
                      </p>
                      <p className="font-medium text-xs">
                        {formatDateTime(selectedResult.completedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Per-question breakdown */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Question Breakdown
                  </h3>

                  {(selectedResult.answers || []).map((answer, idx) => (
                    <Card
                      key={idx}
                      className={
                        answer.isCorrect
                          ? "border-emerald-200"
                          : "border-red-200"
                      }
                    >
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start gap-2">
                          {answer.isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              Q{idx + 1}: {answer.questionText}
                            </p>

                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <div
                                className={`rounded-md p-2 ${answer.isCorrect ? "bg-emerald-50" : "bg-red-50"}`}
                              >
                                <p className="text-xs text-muted-foreground">
                                  Candidate&apos;s Answer
                                </p>
                                <p
                                  className={`font-medium ${answer.isCorrect ? "text-emerald-700" : "text-red-700"}`}
                                >
                                  {answer.candidateAnswer || "(no answer)"}
                                </p>
                              </div>
                              {!answer.isCorrect && (
                                <div className="rounded-md p-2 bg-emerald-50">
                                  <p className="text-xs text-muted-foreground">
                                    Correct Answer
                                  </p>
                                  <p className="font-medium text-emerald-700">
                                    {answer.correctAnswer}
                                  </p>
                                </div>
                              )}
                            </div>

                            {answer.explanation && (
                              <p className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                                <span className="font-medium">Explanation:</span>{" "}
                                {answer.explanation}
                              </p>
                            )}

                            <p className="text-xs text-muted-foreground mt-1">
                              {answer.points} point{answer.points !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {(!selectedResult.answers || selectedResult.answers.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No answer breakdown available
                    </p>
                  )}
                </div>
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
