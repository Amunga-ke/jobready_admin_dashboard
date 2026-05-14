"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format";
import { toast } from "sonner";
import { Search, Plus, Trash2, Tag, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  _count: { listings: number };
  createdAt?: string;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [newTag, setNewTag] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Tag | null>(null);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("q", search);

    try {
      const res = await fetch(`/api/admin/tags?${params}`);
      const data = await res.json();
      setTags(data.tags || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to fetch tags");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  const totalPages = Math.ceil(total / 20);

  const handleAdd = async () => {
    if (!newTag.trim()) { toast.error("Tag name is required"); return; }
    setAdding(true);
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTag.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create tag");
      } else {
        toast.success("Tag added");
        setNewTag("");
        fetchTags();
      }
    } catch {
      toast.error("Failed to create tag");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (tag: Tag) => {
    try {
      await fetch(`/api/admin/tags/${tag.id}`, { method: "DELETE" });
      toast.success("Tag deleted");
      setDeleting(null);
      fetchTags();
    } catch {
      toast.error("Failed to delete tag");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Tag className="h-6 w-6" /> Tags</h1>
        <p className="text-muted-foreground">Manage listing tags</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tags..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="New tag name..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            className="sm:w-64"
          />
          <Button onClick={handleAdd} disabled={adding || !newTag.trim()}>
            {adding ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            Add
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Usage Count</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-10 w-full" /></TableCell></TableRow>)
              ) : tags.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                  <Tag className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  No tags found
                </TableCell></TableRow>
              ) : tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <Badge variant="secondary" className="text-sm">{tag.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{tag._count.listings} listing{tag._count.listings !== 1 ? "s" : ""}</span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleting(tag)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

      {/* Delete Confirmation */}
      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Tag</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the tag <strong>&ldquo;{deleting?.name}&rdquo;</strong>?
            {deleting && deleting._count.listings > 0 && (
              <span className="block mt-1 text-amber-600">This tag is used in {deleting._count.listings} listing{deleting._count.listings !== 1 ? "s" : ""}.</span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleting && handleDelete(deleting)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
