"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { formatRelativeTime, formatDate, formatDateTime } from "@/lib/format";
import {
  Search, Eye, Trash2, ChevronLeft, ChevronRight,
  RefreshCw, ExternalLink, AlertCircle, Clock, CheckCircle2, XCircle,
  Facebook, Instagram, Linkedin, Twitter, MessageCircle, Activity,
  Copy
} from "lucide-react";

interface SocialPostItem {
  id: string;
  platform: string;
  platformPostId: string | null;
  platformUrl: string | null;
  caption: string;
  posterUrl: string | null;
  status: string;
  postType: string;
  errorMessage: string | null;
  postedAt: string | null;
  createdAt: string;
  accountId: string;
  listingId: string | null;
  account: {
    id: string;
    platform: string;
    pageName: string | null;
    platformUsername: string | null;
  };
  listing: {
    id: string;
    title: string;
    slug: string;
    listingType: string;
    company: { id: string; name: string } | null;
  } | null;
}

interface SocialPostDetail extends SocialPostItem {
  metadata: string | null;
  account: {
    id: string;
    platform: string;
    pageName: string | null;
    platformUsername: string | null;
    isActive: boolean;
  };
}

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
  PENDING: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock, label: "Pending" },
  POSTED: { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2, label: "Posted" },
  FAILED: { color: "bg-red-100 text-red-700 border-red-200", icon: XCircle, label: "Failed" },
};

const PLATFORMS = [
  { value: "", label: "All Platforms" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "TWITTER", label: "Twitter" },
  { value: "WHATSAPP", label: "WhatsApp" },
];

const STATUSES = [
  { value: "", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "POSTED", label: "Posted" },
  { value: "FAILED", label: "Failed" },
];

function PlatformIcon({ platform, className = "h-4 w-4" }: { platform: string; className?: string }) {
  switch (platform) {
    case "FACEBOOK": return <Facebook className={className} />;
    case "INSTAGRAM": return <Instagram className={className} />;
    case "LINKEDIN": return <Linkedin className={className} />;
    case "TWITTER": return <Twitter className={className} />;
    case "WHATSAPP": return <MessageCircle className={className} />;
    default: return <Activity className={className} />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`text-[10px] gap-1 ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export default function SocialPostsPage() {
  const [posts, setPosts] = useState<SocialPostItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [platform, setPlatform] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<SocialPostDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<SocialPostItem | null>(null);
  const limit = 20;

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (platform) params.set("platform", platform);
    if (status) params.set("status", status);
    if (debouncedSearch) params.set("q", debouncedSearch);

    try {
      const res = await fetch(`/api/admin/social/posts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPosts(data.posts || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load social posts");
    } finally {
      setLoading(false);
    }
  }, [page, platform, status, debouncedSearch, limit]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const totalPages = Math.ceil(total / limit);

  const fetchPostDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/social/posts/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSelectedPost(data);
    } catch {
      toast.error("Failed to load post details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      const res = await fetch(`/api/admin/social/posts/${deleteDialog.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Post deleted");
      setDeleteDialog(null);
      fetchPosts();
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const handleCopyCaption = (caption: string) => {
    navigator.clipboard.writeText(caption);
    toast.success("Caption copied to clipboard");
  };

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
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
          <h1 className="text-2xl font-bold">Post History</h1>
          <p className="text-muted-foreground">View all social media posts</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={platform} onValueChange={(v) => { setPlatform(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            {PLATFORMS.map((p) => (
              <SelectItem key={p.value || "all"} value={p.value || "all"}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s.value || "all"} value={s.value || "all"}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(platform || status || debouncedSearch) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPlatform("");
              setStatus("");
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
                  <TableHead>Platform</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead className="hidden lg:table-cell">Caption Preview</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Posted</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton className="h-12 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">No posts found</p>
                      <p className="text-sm text-muted-foreground">Posts will appear here after you share jobs to social media</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PlatformIcon platform={post.platform} />
                          <span className="text-sm">{post.platform}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[200px]">
                            {post.listing?.title || "Untitled"}
                          </p>
                          {post.account?.pageName && (
                            <p className="text-[11px] text-muted-foreground">{post.account.pageName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                          {post.caption.slice(0, 80)}{post.caption.length > 80 ? "..." : ""}
                        </p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={post.status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {post.postedAt ? formatRelativeTime(post.postedAt) : formatRelativeTime(post.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fetchPostDetail(post.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => setDeleteDialog(post)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Post Detail Dialog */}
      <Dialog open={!!selectedPost || detailLoading} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : selectedPost && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <PlatformIcon platform={selectedPost.platform} className="h-6 w-6" />
                  <div>
                    <h3 className="font-semibold">{selectedPost.platform}</h3>
                    {selectedPost.account?.pageName && (
                      <p className="text-sm text-muted-foreground">{selectedPost.account.pageName}</p>
                    )}
                  </div>
                </div>
                <StatusBadge status={selectedPost.status} />
              </div>

              <Separator />

              {/* Listing Info */}
              {selectedPost.listing && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Related Listing</p>
                  <p className="font-medium text-sm">{selectedPost.listing.title}</p>
                  {selectedPost.listing.company && (
                    <p className="text-xs text-muted-foreground">{selectedPost.listing.company.name}</p>
                  )}
                </div>
              )}

              {/* Poster Image */}
              {selectedPost.posterUrl && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Poster</p>
                  <img
                    src={selectedPost.posterUrl}
                    alt="Job poster"
                    className="rounded-lg border max-h-64 w-auto object-contain"
                  />
                </div>
              )}

              {/* Caption */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Caption</p>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleCopyCaption(selectedPost.caption)}>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-sm whitespace-pre-wrap">{selectedPost.caption}</p>
                </div>
              </div>

              {/* Platform URL */}
              {selectedPost.platformUrl && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Platform Post</p>
                  <a
                    href={selectedPost.platformUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View on {selectedPost.platform}
                  </a>
                </div>
              )}

              {/* Error Message */}
              {selectedPost.status === "FAILED" && selectedPost.errorMessage && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm font-medium text-red-700">Error</p>
                  </div>
                  <p className="text-sm text-red-600">{selectedPost.errorMessage}</p>
                </div>
              )}

              {/* Timestamps */}
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Created</p>
                  <p className="font-medium">{formatDateTime(selectedPost.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Posted</p>
                  <p className="font-medium">
                    {selectedPost.postedAt ? formatDateTime(selectedPost.postedAt) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Post Type</p>
                  <p className="font-medium">{selectedPost.postType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Platform Post ID</p>
                  <p className="font-medium font-mono text-xs">{selectedPost.platformPostId || "—"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
