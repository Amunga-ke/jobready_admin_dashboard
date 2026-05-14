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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelativeTime } from "@/lib/format";
import { toast } from "sonner";
import { Search, MoreHorizontal, Plus, Pencil, Trash2, Eye, EyeOff, Megaphone } from "lucide-react";

interface JobUpdate {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  source: string;
  updateType: string;
  pdfUrl: string | null;
  imageUrl: string | null;
  listingSlug: string | null;
  postedBy: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 191);
}

const emptyForm = {
  title: "", slug: "", body: "", source: "", updateType: "ANNOUNCEMENT",
  pdfUrl: "", imageUrl: "", listingSlug: "", postedBy: "admin", status: "DRAFT",
};

const updateTypes = ["ANNOUNCEMENT", "TENDER", "CAREER", "ALERT", "NEWS", "TIP"];

const typeColors: Record<string, string> = {
  ANNOUNCEMENT: "bg-blue-100 text-blue-700",
  TENDER: "bg-amber-100 text-amber-700",
  CAREER: "bg-green-100 text-green-700",
  ALERT: "bg-red-100 text-red-700",
  NEWS: "bg-purple-100 text-purple-700",
  TIP: "bg-cyan-100 text-cyan-700",
};

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<JobUpdate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [updateType, setUpdateType] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<JobUpdate | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchUpdates = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("q", search);
    if (status) params.set("status", status);
    if (updateType) params.set("updateType", updateType);

    try {
      const res = await fetch(`/api/admin/updates?${params}`);
      const data = await res.json();
      setUpdates(data.updates || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to fetch updates");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, updateType]);

  useEffect(() => { fetchUpdates(); }, [fetchUpdates]);

  const totalPages = Math.ceil(total / 20);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (update: JobUpdate) => {
    setEditing(update);
    setForm({
      title: update.title, slug: update.slug, body: update.body || "", source: update.source,
      updateType: update.updateType, pdfUrl: update.pdfUrl || "", imageUrl: update.imageUrl || "",
      listingSlug: update.listingSlug || "", postedBy: update.postedBy, status: update.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.pdfUrl) delete (payload as Record<string, unknown>).pdfUrl;
      if (!payload.imageUrl) delete (payload as Record<string, unknown>).imageUrl;
      if (!payload.listingSlug) delete (payload as Record<string, unknown>).listingSlug;
      if (!payload.body) delete (payload as Record<string, unknown>).body;

      if (!editing) {
        if (!payload.slug) payload.slug = slugify(payload.title);
        await fetch("/api/admin/updates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        toast.success("Update created");
      } else {
        await fetch(`/api/admin/updates/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        toast.success("Update updated");
      }
      setDialogOpen(false);
      fetchUpdates();
    } catch {
      toast.error("Failed to save update");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/updates/${id}`, { method: "DELETE" });
      toast.success("Update deleted");
      setDeleting(null);
      fetchUpdates();
    } catch {
      toast.error("Failed to delete update");
    }
  };

  const toggleStatus = async (update: JobUpdate) => {
    const newStatus = update.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      await fetch(`/api/admin/updates/${update.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
      toast.success(`Update ${newStatus === "PUBLISHED" ? "published" : "unpublished"}`);
      fetchUpdates();
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="h-6 w-6" /> Job Updates</h1>
          <p className="text-muted-foreground">Manage announcements and job updates</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Update</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search updates..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Tabs value={status} onValueChange={(v) => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="PUBLISHED">Published</TabsTrigger>
            <TabsTrigger value="DRAFT">Draft</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={updateType} onValueChange={(v) => { setUpdateType(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {updateTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Source</TableHead>
                  <TableHead className="hidden lg:table-cell">Posted By</TableHead>
                  <TableHead className="hidden xl:table-cell">Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell></TableRow>)
                ) : updates.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Megaphone className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    No updates found
                  </TableCell></TableRow>
                ) : updates.map((update) => (
                  <TableRow key={update.id}>
                    <TableCell>
                      <p className="font-medium text-sm truncate max-w-[250px]">{update.title}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${typeColors[update.updateType] || "bg-gray-100 text-gray-700"}`} variant="outline">
                        {update.updateType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${update.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`} variant="outline">
                        {update.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{update.source || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{update.postedBy}</TableCell>
                    <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">{formatRelativeTime(update.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(update)}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(update)}>
                            {update.status === "PUBLISHED" ? <><EyeOff className="h-4 w-4 mr-2" />Unpublish</> : <><Eye className="h-4 w-4 mr-2" />Publish</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleting(update.id)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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
            <DialogTitle>{editing ? "Edit Update" : "New Update"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-3">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })} placeholder="Update title" />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="update-slug" />
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Update content..." rows={8} className="min-h-[150px]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Update Type</Label>
                  <Select value={form.updateType} onValueChange={(v) => setForm({ ...form, updateType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{updateTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
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
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Source name" />
                </div>
                <div className="space-y-2">
                  <Label>Posted By</Label>
                  <Input value={form.postedBy} onChange={(e) => setForm({ ...form, postedBy: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>PDF URL</Label>
                  <Input value={form.pdfUrl} onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Related Listing Slug</Label>
                <Input value={form.listingSlug} onChange={(e) => setForm({ ...form, listingSlug: e.target.value })} placeholder="job-listing-slug" />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>{submitting ? "Saving..." : editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Update</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this update? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleting && handleDelete(deleting)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
