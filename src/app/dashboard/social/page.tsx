"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/format";
import {
  Plus, Unplug, RefreshCw, ExternalLink, Settings,
  Facebook, Instagram, Linkedin, Twitter, MessageCircle,
  CheckCircle2, XCircle, Clock, Activity
} from "lucide-react";

interface SocialAccount {
  id: string;
  platform: string;
  platformUserId: string | null;
  platformUsername: string | null;
  pageId: string | null;
  pageName: string | null;
  isActive: boolean;
  autoPost: boolean;
  autoPostJobTypes: string | null;
  lastPostedAt: string | null;
  createdAt: string;
  updatedAt: string;
  companyId: string | null;
  company: { id: string; name: string; logo: string | null } | null;
  _count: { socialPosts: number };
}

const PLATFORMS = [
  { value: "FACEBOOK", label: "Facebook", icon: Facebook, color: "bg-blue-600", textColor: "text-white" },
  { value: "INSTAGRAM", label: "Instagram", icon: Instagram, color: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400", textColor: "text-white" },
  { value: "LINKEDIN", label: "LinkedIn", icon: Linkedin, color: "bg-sky-700", textColor: "text-white" },
  { value: "TWITTER", label: "Twitter / X", icon: Twitter, color: "bg-black", textColor: "text-white" },
  { value: "WHATSAPP", label: "WhatsApp Channel", icon: MessageCircle, color: "bg-green-600", textColor: "text-white" },
];

const JOB_TYPES = [
  { value: "JOB", label: "Job" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "CASUAL", label: "Casual" },
  { value: "OPPORTUNITY", label: "Opportunity" },
];

function PlatformIcon({ platform, className = "h-5 w-5" }: { platform: string; className?: string }) {
  const p = PLATFORMS.find((pl) => pl.value === platform);
  if (!p) return <Activity className={className} />;
  const Icon = p.icon;
  return <Icon className={className} />;
}

function PlatformBadge({ platform }: { platform: string }) {
  const p = PLATFORMS.find((pl) => pl.value === platform);
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${p?.color || "bg-slate-600"} ${p?.textColor || "text-white"}`}>
      <PlatformIcon platform={platform} className="h-3.5 w-3.5" />
      {p?.label || platform}
    </div>
  );
}

export default function SocialAccountsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [disconnectDialog, setDisconnectDialog] = useState<SocialAccount | null>(null);
  const [settingsDialog, setSettingsDialog] = useState<SocialAccount | null>(null);

  // Add account form state
  const [formPlatform, setFormPlatform] = useState("");
  const [formAccessToken, setFormAccessToken] = useState("");
  const [formPageId, setFormPageId] = useState("");
  const [formPageName, setFormPageName] = useState("");
  const [formPlatformUsername, setFormPlatformUsername] = useState("");
  const [formAutoPost, setFormAutoPost] = useState(false);
  const [formJobTypes, setFormJobTypes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Settings dialog state
  const [editAutoPost, setEditAutoPost] = useState(false);
  const [editJobTypes, setEditJobTypes] = useState<string[]>([]);
  const [editIsActive, setEditIsActive] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/social/accounts");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch {
      toast.error("Failed to load social accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleAddAccount = async () => {
    if (!formPlatform) {
      toast.error("Please select a platform");
      return;
    }
    if (!formPageName) {
      toast.error("Please enter a page name");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/social/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: formPlatform,
          accessToken: formAccessToken || undefined,
          pageId: formPageId || undefined,
          pageName: formPageName,
          platformUsername: formPlatformUsername || undefined,
          autoPost: formAutoPost,
          autoPostJobTypes: formAutoPost ? formJobTypes : [],
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add account");
      }
      toast.success("Social account connected successfully");
      setAddDialogOpen(false);
      resetForm();
      fetchAccounts();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to add account";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormPlatform("");
    setFormAccessToken("");
    setFormPageId("");
    setFormPageName("");
    setFormPlatformUsername("");
    setFormAutoPost(false);
    setFormJobTypes([]);
  };

  const handleDisconnect = async () => {
    if (!disconnectDialog) return;
    try {
      const res = await fetch(`/api/admin/social/accounts/${disconnectDialog.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Account disconnected");
      setDisconnectDialog(null);
      fetchAccounts();
    } catch {
      toast.error("Failed to disconnect account");
    }
  };

  const openSettings = (account: SocialAccount) => {
    setEditAutoPost(account.autoPost);
    setEditIsActive(account.isActive);
    setEditJobTypes(account.autoPostJobTypes ? JSON.parse(account.autoPostJobTypes) : []);
    setSettingsDialog(account);
  };

  const handleSaveSettings = async () => {
    if (!settingsDialog) return;
    setSavingSettings(true);
    try {
      const res = await fetch(`/api/admin/social/accounts/${settingsDialog.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: editIsActive,
          autoPost: editAutoPost,
          autoPostJobTypes: editAutoPost ? editJobTypes : [],
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Account settings updated");
      setSettingsDialog(null);
      fetchAccounts();
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleJobType = (type: string, types: string[], setTypes: (v: string[]) => void) => {
    setTypes(types.includes(type) ? types.filter((t) => t !== type) : [...types, type]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Social Media</h1>
          <p className="text-muted-foreground">Manage connected social media accounts</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Connect Account
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{accounts.length}</p>
                <p className="text-xs text-muted-foreground">Total Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{accounts.filter((a) => a.isActive).length}</p>
                <p className="text-xs text-muted-foreground">Active Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{accounts.filter((a) => a.autoPost).length}</p>
                <p className="text-xs text-muted-foreground">Auto-Posting</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Connected Accounts</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-4 w-36 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Social Accounts Connected</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Connect your social media accounts to start posting jobs automatically
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Connect Your First Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <Card key={account.id} className={!account.isActive ? "opacity-60" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <PlatformBadge platform={account.platform} />
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className={`text-[10px] ${account.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                        {account.isActive ? <><CheckCircle2 className="h-3 w-3 mr-1" />Active</> : <><XCircle className="h-3 w-3 mr-1" />Inactive</>}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <h3 className="font-semibold text-base">{account.pageName || "Unnamed Page"}</h3>
                    {account.platformUsername && (
                      <p className="text-sm text-muted-foreground">@{account.platformUsername}</p>
                    )}
                    {account.company && (
                      <p className="text-xs text-muted-foreground">{account.company.name}</p>
                    )}
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Auto-post</span>
                      <Badge variant={account.autoPost ? "default" : "outline"} className={account.autoPost ? "bg-green-600 text-[10px]" : "text-[10px]"}>
                        {account.autoPost ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    {account.autoPost && account.autoPostJobTypes && (
                      <div className="flex flex-wrap gap-1">
                        {JSON.parse(account.autoPostJobTypes).map((type: string) => (
                          <Badge key={type} variant="secondary" className="text-[10px]">{type}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Posts</span>
                      <span className="font-medium">{account._count.socialPosts}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last posted</span>
                      <span className="text-xs text-muted-foreground">
                        {account.lastPostedAt ? formatRelativeTime(account.lastPostedAt) : "Never"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openSettings(account)}
                    >
                      <Settings className="h-3.5 w-3.5 mr-1.5" />
                      Settings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={() => setDisconnectDialog(account)}
                    >
                      <Unplug className="h-3.5 w-3.5 mr-1.5" />
                      Disconnect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Account Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Social Account</DialogTitle>
            <DialogDescription>Add a new social media account for posting jobs</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={formPlatform} onValueChange={setFormPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <div className="flex items-center gap-2">
                        <p.icon className="h-4 w-4" />
                        {p.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Page Name *</Label>
              <Input
                placeholder="e.g., JobReady Kenya"
                value={formPageName}
                onChange={(e) => setFormPageName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Username / Handle</Label>
              <Input
                placeholder="e.g., @jobreadykenya"
                value={formPlatformUsername}
                onChange={(e) => setFormPlatformUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Page ID</Label>
              <Input
                placeholder="Platform page ID"
                value={formPageId}
                onChange={(e) => setFormPageId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Access Token</Label>
              <Textarea
                placeholder="Paste your access token here..."
                value={formAccessToken}
                onChange={(e) => setFormAccessToken(e.target.value)}
                className="font-mono text-xs"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This token is stored securely and used to post on your behalf
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Auto-post jobs</Label>
                <p className="text-xs text-muted-foreground">Automatically post new jobs</p>
              </div>
              <Switch checked={formAutoPost} onCheckedChange={setFormAutoPost} />
            </div>

            {formAutoPost && (
              <div className="space-y-2">
                <Label>Job types to auto-post</Label>
                <div className="grid grid-cols-2 gap-2">
                  {JOB_TYPES.map((type) => (
                    <div
                      key={type.value}
                      className={`flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                        formJobTypes.includes(type.value)
                          ? "bg-primary/5 border-primary/30"
                          : "hover:bg-slate-50"
                      }`}
                      onClick={() => toggleJobType(type.value, formJobTypes, setFormJobTypes)}
                    >
                      <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                        formJobTypes.includes(type.value) ? "bg-primary border-primary" : "border-slate-300"
                      }`}>
                        {formJobTypes.includes(type.value) && (
                          <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm">{type.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleAddAccount} disabled={submitting || !formPlatform || !formPageName}>
              {submitting ? "Connecting..." : "Connect Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={!!settingsDialog} onOpenChange={() => setSettingsDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Account Settings</DialogTitle>
            <DialogDescription>
              Configure {settingsDialog?.pageName || "this account"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Enable or disable this account</p>
              </div>
              <Switch checked={editIsActive} onCheckedChange={setEditIsActive} />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Auto-post jobs</Label>
                <p className="text-xs text-muted-foreground">Automatically post new jobs</p>
              </div>
              <Switch checked={editAutoPost} onCheckedChange={setEditAutoPost} />
            </div>

            {editAutoPost && (
              <div className="space-y-2">
                <Label>Job types to auto-post</Label>
                <div className="grid grid-cols-2 gap-2">
                  {JOB_TYPES.map((type) => (
                    <div
                      key={type.value}
                      className={`flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                        editJobTypes.includes(type.value)
                          ? "bg-primary/5 border-primary/30"
                          : "hover:bg-slate-50"
                      }`}
                      onClick={() => toggleJobType(type.value, editJobTypes, setEditJobTypes)}
                    >
                      <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                        editJobTypes.includes(type.value) ? "bg-primary border-primary" : "border-slate-300"
                      }`}>
                        {editJobTypes.includes(type.value) && (
                          <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm">{type.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsDialog(null)}>Cancel</Button>
            <Button onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation */}
      <AlertDialog open={!!disconnectDialog} onOpenChange={() => setDisconnectDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Social Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect <strong>{disconnectDialog?.pageName}</strong> ({disconnectDialog?.platform})?
              This will stop any auto-posting and remove the account. Existing post history will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect} className="bg-red-600 hover:bg-red-700">
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
