"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, FolderTree, Subtitles } from "lucide-react";

interface Subcategory {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  sortOrder: number;
  active: boolean;
  _count: { listings: number };
}

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  sortOrder: number;
  active: boolean;
  _count: { subcategories: number; listings: number };
  subcategories: Subcategory[];
}

const emptyCategoryForm = { name: "", slug: "", icon: "", sortOrder: 0, active: true };
const emptySubForm = { name: "", slug: "", sortOrder: 0, active: true };

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 191);
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState(emptyCategoryForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingCat, setDeletingCat] = useState<string | null>(null);

  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [subParentId, setSubParentId] = useState<string>("");
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
  const [subForm, setSubForm] = useState(emptySubForm);
  const [deletingSub, setDeletingSub] = useState<string | null>(null);
  const [deletingSubParentId, setDeletingSubParentId] = useState<string>("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreateCategory = () => {
    setEditingCat(null);
    setCatForm(emptyCategoryForm);
    setCatDialogOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name, slug: cat.slug, icon: cat.icon || "", sortOrder: cat.sortOrder, active: cat.active });
    setCatDialogOpen(true);
  };

  const handleCategorySubmit = async () => {
    if (!catForm.name.trim() || !catForm.slug.trim()) { toast.error("Name and slug are required"); return; }
    setSubmitting(true);
    try {
      if (!editingCat) {
        await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(catForm) });
        toast.success("Category created");
      } else {
        await fetch(`/api/admin/categories/${editingCat.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(catForm) });
        toast.success("Category updated");
      }
      setCatDialogOpen(false);
      fetchCategories();
    } catch {
      toast.error("Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      toast.success("Category deleted");
      setDeletingCat(null);
      fetchCategories();
    } catch {
      toast.error("Failed to delete category");
    }
  };

  const toggleCategoryActive = async (cat: Category) => {
    try {
      await fetch(`/api/admin/categories/${cat.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !cat.active }) });
      toast.success(cat.active ? "Category deactivated" : "Category activated");
      fetchCategories();
    } catch {
      toast.error("Failed to toggle category");
    }
  };

  const openCreateSub = (categoryId: string) => {
    setSubParentId(categoryId);
    setEditingSub(null);
    setSubForm(emptySubForm);
    setSubDialogOpen(true);
  };

  const openEditSub = (sub: Subcategory, categoryId: string) => {
    setSubParentId(categoryId);
    setEditingSub(sub);
    setSubForm({ name: sub.name, slug: sub.slug, sortOrder: sub.sortOrder, active: sub.active });
    setSubDialogOpen(true);
  };

  const handleSubSubmit = async () => {
    if (!subForm.name.trim() || !subForm.slug.trim()) { toast.error("Name and slug are required"); return; }
    setSubmitting(true);
    try {
      if (!editingSub) {
        await fetch(`/api/admin/categories/${subParentId}/subcategories`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subForm) });
        toast.success("Subcategory created");
      } else {
        await fetch(`/api/admin/categories/${subParentId}/subcategories`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subId: editingSub.id, ...subForm }) });
        toast.success("Subcategory updated");
      }
      setSubDialogOpen(false);
      fetchCategories();
    } catch {
      toast.error("Failed to save subcategory");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSub = async (subId: string, parentId: string) => {
    try {
      await fetch(`/api/admin/categories/${parentId}/subcategories?subId=${subId}`, { method: "DELETE" });
      toast.success("Subcategory deleted");
      setDeletingSub(null);
      fetchCategories();
    } catch {
      toast.error("Failed to delete subcategory");
    }
  };

  const toggleSubActive = async (sub: Subcategory, parentId: string) => {
    try {
      await fetch(`/api/admin/categories/${parentId}/subcategories`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subId: sub.id, active: !sub.active }) });
      toast.success(sub.active ? "Subcategory deactivated" : "Subcategory activated");
      fetchCategories();
    } catch {
      toast.error("Failed to toggle subcategory");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FolderTree className="h-6 w-6" /> Categories</h1>
          <p className="text-muted-foreground">Manage job categories and subcategories</p>
        </div>
        <Button onClick={openCreateCategory}><Plus className="h-4 w-4 mr-1" /> Add Category</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-10 w-full" /></CardContent></Card>)}</div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FolderTree className="h-10 w-10 mx-auto mb-2 opacity-30" />
            No categories yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => toggleExpand(cat.id)}>
                      {expanded.has(cat.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{cat.name}</p>
                        <Badge variant="outline" className="text-[10px]">{cat.slug}</Badge>
                        <Badge variant={cat.active ? "default" : "secondary"} className="text-[10px]">{cat.active ? "Active" : "Inactive"}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cat._count.subcategories} subcategories · {cat._count.listings} listings · Order: {cat.sortOrder}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Switch checked={cat.active} onCheckedChange={() => toggleCategoryActive(cat)} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditCategory(cat)}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openCreateSub(cat.id)}><Plus className="h-4 w-4 mr-2" />Add Subcategory</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletingCat(cat.id)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Expanded Subcategories */}
                {expanded.has(cat.id) && cat.subcategories.length > 0 && (
                  <div className="mt-3 ml-10 border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden sm:table-cell">Slug</TableHead>
                          <TableHead className="hidden md:table-cell">Listings</TableHead>
                          <TableHead className="hidden md:table-cell">Order</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-24 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cat.subcategories.map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell className="font-medium text-sm">{sub.name}</TableCell>
                            <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{sub.slug}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{sub._count.listings}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm">{sub.sortOrder}</TableCell>
                            <TableCell>
                              <Badge variant={sub.active ? "default" : "secondary"} className="text-[10px]">{sub.active ? "Active" : "Inactive"}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Switch checked={sub.active} onCheckedChange={() => toggleSubActive(sub, cat.id)} className="scale-75" />
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSub(sub, cat.id)}><Pencil className="h-3 w-3" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => { setDeletingSub(sub.id); setDeletingSubParentId(cat.id); }}><Trash2 className="h-3 w-3" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {expanded.has(cat.id) && cat.subcategories.length === 0 && (
                  <div className="mt-3 ml-10 text-center py-6 text-sm text-muted-foreground border rounded-lg bg-muted/30">
                    <Subtitles className="h-6 w-6 mx-auto mb-1 opacity-30" />
                    No subcategories yet
                    <Button variant="link" className="ml-1 p-0 h-auto" onClick={() => openCreateSub(cat.id)}>Add one</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCat ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value, slug: editingCat ? catForm.slug : slugify(e.target.value) })} placeholder="Category name" />
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input value={catForm.slug} onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })} placeholder="category-slug" />
            </div>
            <div className="space-y-2">
              <Label>Icon (emoji)</Label>
              <Input value={catForm.icon} onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })} placeholder="💼" />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" value={catForm.sortOrder} onChange={(e) => setCatForm({ ...catForm, sortOrder: Number(e.target.value) || 0 })} min={0} />
            </div>
            <div className="flex items-center space-x-2">
              <Switch checked={catForm.active} onCheckedChange={(v) => setCatForm({ ...catForm, active: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCategorySubmit} disabled={submitting}>{submitting ? "Saving..." : editingCat ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subcategory Dialog */}
      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingSub ? "Edit Subcategory" : "New Subcategory"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value, slug: editingSub ? subForm.slug : slugify(e.target.value) })} placeholder="Subcategory name" />
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input value={subForm.slug} onChange={(e) => setSubForm({ ...subForm, slug: e.target.value })} placeholder="subcategory-slug" />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" value={subForm.sortOrder} onChange={(e) => setSubForm({ ...subForm, sortOrder: Number(e.target.value) || 0 })} min={0} />
            </div>
            <div className="flex items-center space-x-2">
              <Switch checked={subForm.active} onCheckedChange={(v) => setSubForm({ ...subForm, active: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubSubmit} disabled={submitting}>{submitting ? "Saving..." : editingSub ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <Dialog open={!!deletingCat} onOpenChange={() => setDeletingCat(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Category</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure? This will also delete all subcategories in this category. This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCat(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deletingCat && handleDeleteCategory(deletingCat)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subcategory Confirmation */}
      <Dialog open={!!deletingSub} onOpenChange={() => setDeletingSub(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Subcategory</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this subcategory? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingSub(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deletingSub && deletingSubParentId && handleDeleteSub(deletingSub, deletingSubParentId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
