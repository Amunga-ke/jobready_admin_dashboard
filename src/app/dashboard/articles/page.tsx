"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelativeTime } from "@/lib/format";
import { toast } from "sonner";
import { Search, MoreHorizontal, Plus, Pencil, Trash2, Eye, EyeOff, Star, StarOff, ChevronLeft, ChevronRight, Newspaper } from "lucide-react";

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImage: string | null;
  category: string;
  tags: string | null;
  author: string;
  authorImage: string | null;
  status: string;
  featured: boolean;
  readTime: number;
  viewCount: number;
  publishedAt: string;
  createdAt: string;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 191);
}

const emptyForm = {
  title: "", slug: "", excerpt: "", body: "", coverImage: "", category: "Career Tips",
  tags: "", author: "JobReady Team", authorImage: "", status: "DRAFT" as string,
  featured: false, readTime: 5,
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [featured, setFeatured] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("q", search);
    if (status) params.set("status", status);
    if (featured) params.set("featured", featured);
    if (category) params.set("category", category);

    try {
      const res = await fetch(`/api/admin/articles?${params}`);
      const data = await res.json();
      setArticles(data.articles || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to fetch articles");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, featured, category]);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  const totalPages = Math.ceil(total / 20);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (article: Article) => {
    setEditing(article);
    setForm({
      title: article.title, slug: article.slug, excerpt: article.excerpt, body: article.body,
      coverImage: article.coverImage || "", category: article.category, tags: article.tags || "",
      author: article.author, authorImage: article.authorImage || "", status: article.status,
      featured: article.featured, readTime: article.readTime,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSubmitting(true);
    try {
      const payload = { ...form, readTime: Number(form.readTime) || 5 };
      if (!editing) {
        if (!payload.slug) payload.slug = slugify(payload.title);
        await fetch("/api/admin/articles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        toast.success("Article created");
      } else {
        await fetch(`/api/admin/articles/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        toast.success("Article updated");
      }
      setDialogOpen(false);
      fetchArticles();
    } catch {
      toast.error("Failed to save article");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
      toast.success("Article deleted");
      setDeleting(null);
      fetchArticles();
    } catch {
      toast.error("Failed to delete article");
    }
  };

  const toggleStatus = async (article: Article) => {
    const newStatus = article.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      await fetch(`/api/admin/articles/${article.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
      toast.success(`Article ${newStatus === "PUBLISHED" ? "published" : "unpublished"}`);
      fetchArticles();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const toggleFeatured = async (article: Article) => {
    try {
      await fetch(`/api/admin/articles/${article.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ featured: !article.featured }) });
      toast.success(article.featured ? "Removed from featured" : "Added to featured");
      fetchArticles();
    } catch {
      toast.error("Failed to update featured status");
    }
  };

  const categories = ["Career Tips", "Job Search", "Interview Tips", "CV Writing", "Industry News", "Salary Guide", "Remote Work", "Government Jobs"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Newspaper className="h-6 w-6" /> Articles</h1>
          <p className="text-muted-foreground">Manage blog articles and career content</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Article</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search articles..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Tabs value={status} onValueChange={(v) => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="PUBLISHED">Published</TabsTrigger>
            <TabsTrigger value="DRAFT">Draft</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={featured} onValueChange={(v) => { setFeatured(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Featured" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Featured</SelectItem>
            <SelectItem value="false">Not Featured</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden md:table-cell">Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Featured</TableHead>
                  <TableHead className="hidden lg:table-cell">Views</TableHead>
                  <TableHead className="hidden xl:table-cell">Published</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell></TableRow>)
                ) : articles.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Newspaper className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    No articles found
                  </TableCell></TableRow>
                ) : articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm truncate max-w-[250px]">{article.title}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[250px]">{article.excerpt}</p>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{article.category}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{article.author}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${article.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`} variant="outline">
                        {article.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {article.featured ? <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{article.viewCount.toLocaleString()}</TableCell>
                    <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">{formatRelativeTime(article.publishedAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(article)}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(article)}>
                            {article.status === "PUBLISHED" ? <><EyeOff className="h-4 w-4 mr-2" />Unpublish</> : <><Eye className="h-4 w-4 mr-2" />Publish</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleFeatured(article)}>
                            {article.featured ? <><StarOff className="h-4 w-4 mr-2" />Remove Featured</> : <><Star className="h-4 w-4 mr-2" />Mark Featured</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleting(article.id)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Article" : "New Article"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-3">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })} placeholder="Article title" />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="article-slug" />
              </div>
              <div className="space-y-2">
                <Label>Excerpt</Label>
                <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Brief summary..." rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Article content..." rows={12} className="min-h-[200px]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cover Image URL</Label>
                  <Input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="tag1, tag2, tag3" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Author</Label>
                  <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Author Image URL</Label>
                  <Input value={form.authorImage} onChange={(e) => setForm({ ...form, authorImage: e.target.value })} placeholder="https://..." />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Read Time (min)</Label>
                  <Input type="number" value={form.readTime} onChange={(e) => setForm({ ...form, readTime: Number(e.target.value) || 5 })} min={1} />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
                  <Label>Featured</Label>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>{submitting ? "Saving..." : editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Article</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this article? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleting && handleDelete(deleting)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
