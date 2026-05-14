"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatKES } from "@/lib/format";
import { toast } from "sonner";
import {
  Layers,
  Plus,
  Pencil,
  Check,
  X,
  Users,
  Briefcase,
  Star,
  Search,
  MessageSquare,
  FileText,
  Eye,
  Trash2,
  Sparkles,
} from "lucide-react";

interface PlanData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxListings: number;
  maxFeatured: number;
  maxCvSearches: number;
  maxTeamMembers: number;
  maxMessagesPerDay: number;
  isActive: boolean;
  sortOrder: number;
  features: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    subscriptions: number;
  };
}

interface PlanFormData {
  name: string;
  slug: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  currency: string;
  maxListings: string;
  maxFeatured: string;
  maxCvSearches: string;
  maxTeamMembers: string;
  maxMessagesPerDay: string;
  isActive: boolean;
  sortOrder: string;
  features: string;
}

const emptyForm: PlanFormData = {
  name: "",
  slug: "",
  description: "",
  priceMonthly: "0",
  priceYearly: "0",
  currency: "KES",
  maxListings: "3",
  maxFeatured: "0",
  maxCvSearches: "0",
  maxTeamMembers: "1",
  maxMessagesPerDay: "10",
  isActive: true,
  sortOrder: "0",
  features: "[]",
};

function planToForm(plan: PlanData): PlanFormData {
  return {
    name: plan.name,
    slug: plan.slug,
    description: plan.description || "",
    priceMonthly: String(plan.priceMonthly),
    priceYearly: String(plan.priceYearly),
    currency: plan.currency,
    maxListings: String(plan.maxListings),
    maxFeatured: String(plan.maxFeatured),
    maxCvSearches: String(plan.maxCvSearches),
    maxTeamMembers: String(plan.maxTeamMembers),
    maxMessagesPerDay: String(plan.maxMessagesPerDay),
    isActive: plan.isActive,
    sortOrder: String(plan.sortOrder),
    features: plan.features,
  };
}

function parseFeatures(featuresStr: string): string[] {
  try {
    const parsed = JSON.parse(featuresStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanData | null>(null);
  const [form, setForm] = useState<PlanFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [viewPlan, setViewPlan] = useState<PlanData | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/plans");
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to fetch plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleCreate = () => {
    setEditingPlan(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleEdit = (plan: PlanData) => {
    setEditingPlan(plan);
    setForm(planToForm(plan));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        priceMonthly: parseInt(form.priceMonthly) || 0,
        priceYearly: parseInt(form.priceYearly) || 0,
        currency: form.currency,
        maxListings: parseInt(form.maxListings) || 0,
        maxFeatured: parseInt(form.maxFeatured) || 0,
        maxCvSearches: parseInt(form.maxCvSearches) || 0,
        maxTeamMembers: parseInt(form.maxTeamMembers) || 0,
        maxMessagesPerDay: parseInt(form.maxMessagesPerDay) || 0,
        isActive: form.isActive,
        sortOrder: parseInt(form.sortOrder) || 0,
        features: form.features,
      };

      if (editingPlan) {
        const res = await fetch(`/api/admin/plans/${editingPlan.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update");
        }
        toast.success("Plan updated successfully");
      } else {
        const res = await fetch("/api/admin/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create");
        }
        toast.success("Plan created successfully");
      }

      setDialogOpen(false);
      fetchPlans();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (plan: PlanData) => {
    try {
      await fetch(`/api/admin/plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !plan.isActive }),
      });
      toast.success(`Plan ${plan.isActive ? "deactivated" : "activated"}`);
      fetchPlans();
    } catch {
      toast.error("Failed to update plan");
    }
  };

  const handleDelete = async (plan: PlanData) => {
    if (!confirm(`Deactivate plan "${plan.name}"? This can be undone later.`)) return;
    try {
      await fetch(`/api/admin/plans/${plan.id}`, { method: "DELETE" });
      toast.success("Plan deactivated");
      fetchPlans();
    } catch {
      toast.error("Failed to deactivate plan");
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const comparisonFeatures = [
    { key: "maxListings", label: "Max Listings", icon: Briefcase },
    { key: "maxFeatured", label: "Max Featured", icon: Star },
    { key: "maxCvSearches", label: "CV Searches", icon: Search },
    { key: "maxTeamMembers", label: "Team Members", icon: Users },
    { key: "maxMessagesPerDay", label: "Messages/Day", icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground">Manage plans and pricing tiers</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </div>

      {/* Plan Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium text-lg">No plans yet</p>
            <p className="text-sm mt-1">Create your first subscription plan</p>
            <Button className="mt-4" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const features = parseFeatures(plan.features);
            const monthlyPrice = plan.priceYearly > 0 && plan.priceMonthly > 0
              ? Math.round(plan.priceYearly / 12)
              : plan.priceMonthly;
            const hasYearlyDiscount = plan.priceYearly > 0 && plan.priceMonthly > 0;

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${!plan.isActive ? "opacity-60" : ""}`}
              >
                {/* Active Badge */}
                <div className="absolute top-3 right-3">
                  <Badge
                    variant={plan.isActive ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {plan.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription className="text-xs font-mono">{plan.slug}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  {/* Pricing */}
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{formatKES(plan.priceMonthly)}</span>
                      {plan.priceMonthly > 0 && (
                        <span className="text-sm text-muted-foreground">/month</span>
                      )}
                    </div>
                    {plan.priceYearly > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium text-emerald-600">{formatKES(plan.priceYearly)}</span>
                        /year
                        {hasYearlyDiscount && (
                          <span className="ml-1 text-xs">
                            (save {formatKES(plan.priceMonthly * 12 - plan.priceYearly)})
                          </span>
                        )}
                      </p>
                    )}
                    {plan.priceMonthly === 0 && plan.priceYearly === 0 && (
                      <p className="text-sm font-medium text-emerald-600">Free</p>
                    )}
                  </div>

                  <Separator />

                  {/* Limits */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" /> Listings
                      </span>
                      <span className="font-medium">{plan.maxListings}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5" /> Featured
                      </span>
                      <span className="font-medium">{plan.maxFeatured}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Search className="h-3.5 w-3.5" /> CV Searches
                      </span>
                      <span className="font-medium">{plan.maxCvSearches}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" /> Team
                      </span>
                      <span className="font-medium">{plan.maxTeamMembers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" /> Messages
                      </span>
                      <span className="font-medium">{plan.maxMessagesPerDay}/day</span>
                    </div>
                  </div>

                  {/* Subscriber count */}
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{plan._count.subscriptions} active subscriber{plan._count.subscriptions !== 1 ? "s" : ""}</span>
                  </div>

                  {/* Features */}
                  {features.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-1.5">
                        {features.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                            <span className="truncate">{f}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setViewPlan(plan)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(plan)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleActive(plan)}
                    >
                      {plan.isActive ? (
                        <X className="h-3.5 w-3.5 text-red-500" />
                      ) : (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Feature Comparison Table */}
      {plans.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-white min-w-[150px]">Feature</TableHead>
                    {plans.map((plan) => (
                      <TableHead key={plan.id} className="text-center min-w-[120px]">
                        <div>
                          <p className="font-semibold text-sm">{plan.name}</p>
                          <p className="text-xs text-muted-foreground">{formatKES(plan.priceMonthly)}/mo</p>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Price Row */}
                  <TableRow className="font-semibold">
                    <TableCell className="sticky left-0 bg-muted/30">Monthly Price</TableCell>
                    {plans.map((plan) => (
                      <TableCell key={plan.id} className="text-center">
                        {plan.priceMonthly === 0 ? (
                          <Badge variant="secondary" className="text-xs">Free</Badge>
                        ) : (
                          formatKES(plan.priceMonthly)
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="sticky left-0 bg-muted/30">Yearly Price</TableCell>
                    {plans.map((plan) => (
                      <TableCell key={plan.id} className="text-center text-sm">
                        {plan.priceYearly === 0 ? "—" : formatKES(plan.priceYearly)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Limits */}
                  {comparisonFeatures.map(({ key, label }) => (
                    <TableRow key={key}>
                      <TableCell className="sticky left-0 bg-muted/30">{label}</TableCell>
                      {plans.map((plan) => (
                        <TableCell key={plan.id} className="text-center font-medium">
                          {(plan as Record<string, number>)[key] ?? 0}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                  {/* Features */}
                  {(() => {
                    const allFeatures = new Set<string>();
                    plans.forEach((p) => parseFeatures(p.features).forEach((f) => allFeatures.add(f)));
                    return Array.from(allFeatures).map((feature) => (
                      <TableRow key={feature}>
                        <TableCell className="sticky left-0 bg-muted/30 text-sm">{feature}</TableCell>
                        {plans.map((plan) => {
                          const has = parseFeatures(plan.features).includes(feature);
                          return (
                            <TableCell key={plan.id} className="text-center">
                              {has ? (
                                <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-gray-300 mx-auto" />
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ));
                  })()}

                  {/* Active Status */}
                  <TableRow>
                    <TableCell className="sticky left-0 bg-muted/30">Active</TableCell>
                    {plans.map((plan) => (
                      <TableCell key={plan.id} className="text-center">
                        <Badge variant={plan.isActive ? "default" : "secondary"} className="text-[10px]">
                          {plan.isActive ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Subscribers */}
                  <TableRow>
                    <TableCell className="sticky left-0 bg-muted/30">Subscribers</TableCell>
                    {plans.map((plan) => (
                      <TableCell key={plan.id} className="text-center font-medium">
                        {plan._count.subscriptions}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Plan Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingPlan ? (
                <>
                  <Pencil className="h-5 w-5" />
                  Edit Plan
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Create Plan
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => {
                        setForm({
                          ...form,
                          name: e.target.value,
                          slug: !editingPlan ? generateSlug(e.target.value) : form.slug,
                        });
                      }}
                      placeholder="e.g. Starter"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug *</Label>
                    <Input
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      placeholder="e.g. starter"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Plan description..."
                    rows={2}
                  />
                </div>
              </div>

              <Separator />

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Pricing
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Monthly Price (KES)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.priceMonthly}
                      onChange={(e) => setForm({ ...form, priceMonthly: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Yearly Price (KES)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.priceYearly}
                      onChange={(e) => setForm({ ...form, priceYearly: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                      placeholder="KES"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Limits */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Limits
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" /> Max Listings
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.maxListings}
                      onChange={(e) => setForm({ ...form, maxListings: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5" /> Max Featured
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.maxFeatured}
                      onChange={(e) => setForm({ ...form, maxFeatured: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Search className="h-3.5 w-3.5" /> Max CV Searches
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.maxCvSearches}
                      onChange={(e) => setForm({ ...form, maxCvSearches: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> Max Team Members
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.maxTeamMembers}
                      onChange={(e) => setForm({ ...form, maxTeamMembers: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" /> Messages/Day
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.maxMessagesPerDay}
                      onChange={(e) => setForm({ ...form, maxMessagesPerDay: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sort Order</Label>
                    <Input
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Features */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Features (JSON Array)
                </h3>
                <Textarea
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  placeholder='["Feature 1", "Feature 2", "Feature 3"]'
                  rows={4}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a JSON array of feature strings. Example: [&quot;Unlimited job posts&quot;, &quot;Priority support&quot;]
                </p>
              </div>

              <Separator />

              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Plan Dialog */}
      <Dialog open={!!viewPlan} onOpenChange={() => setViewPlan(null)}>
        <DialogContent className="max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Plan Details
            </DialogTitle>
          </DialogHeader>
          {viewPlan && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold">{viewPlan.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">{viewPlan.slug}</p>
                  </div>
                  <Badge variant={viewPlan.isActive ? "default" : "secondary"}>
                    {viewPlan.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {viewPlan.description && (
                  <p className="text-sm text-muted-foreground">{viewPlan.description}</p>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly Price</p>
                    <p className="text-lg font-bold">{formatKES(viewPlan.priceMonthly)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Yearly Price</p>
                    <p className="text-lg font-bold">{formatKES(viewPlan.priceYearly)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Currency</p>
                    <p className="text-sm">{viewPlan.currency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Active Subscribers</p>
                    <p className="text-sm font-medium">{viewPlan._count.subscriptions}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Limits
                  </h3>
                  <div className="space-y-2 text-sm">
                    {comparisonFeatures.map(({ key, label, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between py-1">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Icon className="h-4 w-4" /> {label}
                        </span>
                        <span className="font-medium">{(viewPlan as Record<string, number>)[key] ?? 0}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {parseFeatures(viewPlan.features).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Features
                      </h3>
                      <div className="space-y-1.5">
                        {parseFeatures(viewPlan.features).map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setViewPlan(null);
                      handleEdit(viewPlan);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleToggleActive(viewPlan)}
                  >
                    {viewPlan.isActive ? (
                      <>
                        <X className="h-4 w-4 mr-2" /> Deactivate
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" /> Activate
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      setViewPlan(null);
                      handleDelete(viewPlan);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
