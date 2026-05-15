"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
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
import { formatKES } from "@/lib/format";
import { toast } from "sonner";
import {
  ClipboardCheck,
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Eye,
  X,
  Clock,
  Target,
  HelpCircle,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────

interface QuestionOption {
  text: string;
}

interface QuestionForm {
  text: string;
  type: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  points: string;
}

interface TestListItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  duration: number;
  passingScore: number;
  pricePerCandidate: number;
  isActive: boolean;
  createdAt: string;
  _count: {
    questions: number;
    results: number;
  };
}

interface TestDetail extends TestListItem {
  questions: {
    id: string;
    text: string;
    type: string;
    options: string[];
    correctAnswer: string;
    explanation: string | null;
    points: number;
    order: number;
  }[];
}

const CATEGORIES = [
  "GENERAL",
  "CODING",
  "APTITUDE",
  "ENGLISH",
  "MATH",
  "TECHNICAL",
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  GENERAL: "bg-slate-100 text-slate-700",
  CODING: "bg-violet-100 text-violet-700",
  APTITUDE: "bg-amber-100 text-amber-700",
  ENGLISH: "bg-emerald-100 text-emerald-700",
  MATH: "bg-rose-100 text-rose-700",
  TECHNICAL: "bg-blue-100 text-blue-700",
};

const QUESTION_TYPES = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TRUE_FALSE", label: "True / False" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
];

const emptyQuestion = (): QuestionForm => ({
  text: "",
  type: "MULTIPLE_CHOICE",
  options: ["", "", "", ""],
  correctAnswer: "",
  explanation: "",
  points: "1",
});

// ── Component ──────────────────────────────────────────────

export default function SkillTestsPage() {
  const [tests, setTests] = useState<TestListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TestDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TestListItem | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [duration, setDuration] = useState("15");
  const [passingScore, setPassingScore] = useState("60");
  const [price, setPrice] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState<QuestionForm[]>([emptyQuestion()]);

  const limit = 10;

  // ── Debounce search ──
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // ── Fetch tests ──
  const fetchTests = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (categoryFilter) params.set("category", categoryFilter);

    try {
      const res = await fetch(`/api/admin/skill-tests?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTests(Array.isArray(data.tests) ? data.tests : Array.isArray(data) ? data : []);
      setTotal(data.total ?? data.tests?.length ?? 0);
    } catch {
      toast.error("Failed to fetch skill tests");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, categoryFilter, limit]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const totalPages = Math.ceil(total / limit);

  // ── CRUD handlers ──
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("GENERAL");
    setDuration("15");
    setPassingScore("60");
    setPrice("0");
    setIsActive(true);
    setQuestions([emptyQuestion()]);
  };

  const openCreate = () => {
    setEditingTest(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = async (test: TestListItem) => {
    try {
      const res = await fetch(`/api/admin/skill-tests/${test.id}`);
      if (!res.ok) throw new Error();
      const detail: TestDetail = await res.json();
      setEditingTest(detail);
      setTitle(detail.title);
      setDescription(detail.description || "");
      setCategory(detail.category);
      setDuration(String(detail.duration));
      setPassingScore(String(detail.passingScore));
      setPrice(String(detail.pricePerCandidate));
      setIsActive(detail.isActive);
      if (detail.questions?.length > 0) {
        setQuestions(
          detail.questions.map((q) => ({
            text: q.text,
            type: q.type,
            options: q.options || [],
            correctAnswer: q.correctAnswer || "",
            explanation: q.explanation || "",
            points: String(q.points),
          }))
        );
      } else {
        setQuestions([emptyQuestion()]);
      }
      setDialogOpen(true);
    } catch {
      toast.error("Failed to load test details");
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (questions.length === 0 || !questions[0].text.trim()) {
      toast.error("At least one question is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        category,
        duration: parseInt(duration) || 15,
        passingScore: parseInt(passingScore) || 60,
        pricePerCandidate: parseInt(price) || 0,
        isActive,
        questions: questions
          .filter((q) => q.text.trim())
          .map((q, idx) => ({
            text: q.text.trim(),
            type: q.type,
            options:
              q.type === "TRUE_FALSE"
                ? ["True", "False"]
                : q.options.filter((o) => o.trim()),
            correctAnswer: q.correctAnswer.trim(),
            explanation: q.explanation.trim() || null,
            points: parseInt(q.points) || 1,
            order: idx,
          })),
      };

      if (editingTest) {
        const res = await fetch(`/api/admin/skill-tests/${editingTest.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update");
        }
        toast.success("Test updated successfully");
      } else {
        const res = await fetch("/api/admin/skill-tests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create");
        }
        toast.success("Test created successfully");
      }

      setDialogOpen(false);
      fetchTests();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save test");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/skill-tests/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Test deleted successfully");
      setDeleteTarget(null);
      fetchTests();
    } catch {
      toast.error("Failed to delete test");
    }
  };

  const handleToggleActive = async (test: TestListItem) => {
    try {
      const res = await fetch(`/api/admin/skill-tests/${test.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !test.isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Test ${test.isActive ? "deactivated" : "activated"}`);
      fetchTests();
    } catch {
      toast.error("Failed to update test");
    }
  };

  // ── Question form helpers ──
  const updateQuestion = (idx: number, updates: Partial<QuestionForm>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...updates } : q))
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveQuestion = (idx: number, dir: "up" | "down") => {
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= questions.length) return;
    setQuestions((prev) => {
      const copy = [...prev];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy;
    });
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = [...q.options];
        opts[oIdx] = value;
        return { ...q, options: opts };
      })
    );
  };

  const addOption = (qIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: [...q.options, ""] } : q
      )
    );
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = q.options.filter((_, j) => j !== oIdx);
        return { ...q, options: opts };
      })
    );
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

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Skills Assessment Tests</h1>
          <p className="text-muted-foreground">
            Manage pre-employment skill tests and questions
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Test
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tests..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={categoryFilter || "all"}
          onValueChange={(v) => {
            setCategoryFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
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
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Questions
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Duration
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Pass Score
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Price (KES)
                  </TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Results
                  </TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}>
                        <Skeleton className="h-12 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : tests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <ClipboardCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">
                        No skill tests found
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Create your first assessment test
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  tests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {test.title}
                          </p>
                          {test.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {test.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] ${CATEGORY_COLORS[test.category] || "bg-gray-100 text-gray-700"}`}
                          variant="outline"
                        >
                          {test.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {test._count.questions}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {test.duration} min
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        <span className="flex items-center gap-1">
                          <Target className="h-3.5 w-3.5 text-muted-foreground" />
                          {test.passingScore}%
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {test.pricePerCandidate > 0
                          ? formatKES(test.pricePerCandidate)
                          : "Free"}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={test.isActive}
                          onCheckedChange={() => handleToggleActive(test)}
                        />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Link href="/dashboard/skill-tests/results">
                          <Badge
                            variant="secondary"
                            className="text-[10px] cursor-pointer hover:bg-indigo-50"
                          >
                            {test._count.results}
                          </Badge>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(test)}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => setDeleteTarget(test)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <Link href="/dashboard/skill-tests/results">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="View Results"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
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

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingTest ? (
                <>
                  <Pencil className="h-5 w-5" />
                  Edit Test
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Create Test
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingTest
                ? "Update test details and questions"
                : "Set up a new skills assessment test"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Test Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Title *</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. General Aptitude Test"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of the test..."
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={category}
                      onValueChange={setCategory}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Passing Score (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={passingScore}
                      onChange={(e) => setPassingScore(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price per Candidate (KES)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
              </div>

              <Separator />

              {/* Questions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Questions ({questions.length})
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addQuestion}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Question
                  </Button>
                </div>

                {questions.map((q, qIdx) => (
                  <Card key={qIdx}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-indigo-600">
                            Q{qIdx + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={qIdx === 0}
                            onClick={() => moveQuestion(qIdx, "up")}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={qIdx === questions.length - 1}
                            onClick={() => moveQuestion(qIdx, "down")}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500"
                          onClick={() => removeQuestion(qIdx)}
                          disabled={questions.length === 1}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      <Textarea
                        value={q.text}
                        onChange={(e) =>
                          updateQuestion(qIdx, { text: e.target.value })
                        }
                        placeholder="Enter question text..."
                        rows={2}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={q.type}
                            onValueChange={(v) =>
                              updateQuestion(qIdx, { type: v })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {QUESTION_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Points</Label>
                          <Input
                            type="number"
                            min={1}
                            className="h-8 text-xs"
                            value={q.points}
                            onChange={(e) =>
                              updateQuestion(qIdx, { points: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      {/* Options (for multiple choice / true-false) */}
                      {q.type !== "SHORT_ANSWER" && (
                        <div className="space-y-2">
                          <Label className="text-xs">Options</Label>
                          {q.type === "TRUE_FALSE" ? (
                            <div className="flex gap-3">
                              {["True", "False"].map((opt) => (
                                <label
                                  key={opt}
                                  className="flex items-center gap-1.5 text-sm"
                                >
                                  <input
                                    type="radio"
                                    name={`correct-${qIdx}`}
                                    checked={q.correctAnswer === opt}
                                    onChange={() =>
                                      updateQuestion(qIdx, {
                                        correctAnswer: opt,
                                      })
                                    }
                                    className="accent-indigo-600"
                                  />
                                  {opt}
                                </label>
                              ))}
                            </div>
                          ) : (
                            <>
                              {q.options.map((opt, oIdx) => (
                                <div
                                  key={oIdx}
                                  className="flex items-center gap-2"
                                >
                                  <input
                                    type="radio"
                                    name={`correct-${qIdx}`}
                                    checked={q.correctAnswer === opt}
                                    onChange={() =>
                                      updateQuestion(qIdx, {
                                        correctAnswer: opt,
                                      })
                                    }
                                    className="accent-indigo-600 flex-shrink-0"
                                  />
                                  <Input
                                    className="h-8 text-sm flex-1"
                                    value={opt}
                                    onChange={(e) =>
                                      updateOption(qIdx, oIdx, e.target.value)
                                    }
                                    placeholder={`Option ${oIdx + 1}`}
                                  />
                                  {q.options.length > 2 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-red-400 flex-shrink-0"
                                      onClick={() => removeOption(qIdx, oIdx)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => addOption(qIdx)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Option
                              </Button>
                              <p className="text-xs text-muted-foreground">
                                Select the radio button next to the correct
                                answer
                              </p>
                            </>
                          )}
                        </div>
                      )}

                      {/* Correct answer for short answer */}
                      {q.type === "SHORT_ANSWER" && (
                        <div className="space-y-1">
                          <Label className="text-xs">Correct Answer</Label>
                          <Input
                            className="h-8 text-sm"
                            value={q.correctAnswer}
                            onChange={(e) =>
                              updateQuestion(qIdx, {
                                correctAnswer: e.target.value,
                              })
                            }
                            placeholder="Expected answer..."
                          />
                        </div>
                      )}

                      <div className="space-y-1">
                        <Label className="text-xs">Explanation (optional)</Label>
                        <Textarea
                          value={q.explanation}
                          onChange={(e) =>
                            updateQuestion(qIdx, {
                              explanation: e.target.value,
                            })
                          }
                          placeholder="Why this is the correct answer..."
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? "Saving..."
                : editingTest
                  ? "Update Test"
                  : "Create Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Test</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
