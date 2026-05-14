"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Settings, Globe, Database, ShieldCheck, Key, Mail, Wrench, CreditCard,
  Loader2, CheckCircle2, Circle, Lock, Eye, EyeOff,
} from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changing, setChanging] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setChanging(true);
    try {
      const res = await fetch("/api/admin/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to change password");
      } else {
        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      toast.error("Failed to change password");
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6" /> Settings</h1>
        <p className="text-muted-foreground">Admin portal settings and configuration</p>
      </div>

      {/* Platform Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> Platform Info</CardTitle>
          <CardDescription>General platform information (read-only)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Platform Name</p>
              <p className="font-medium">JobReady Kenya</p>
            </div>
            <div>
              <p className="text-muted-foreground">URL</p>
              <p className="font-medium">jobready.co.ke</p>
            </div>
            <div>
              <p className="text-muted-foreground">Environment</p>
              <Badge variant="outline" className="text-[10px]">Production</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Version</p>
              <p className="font-medium">v1.0.0</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" /> Database Status</CardTitle>
          <CardDescription>Database connection status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Connected</p>
              <p className="text-xs text-muted-foreground">MySQL database connection is active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Admin Profile</CardTitle>
          <CardDescription>Current admin account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{session?.user?.name || "Admin"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{session?.user?.email || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Role</p>
              <Badge variant="default" className="text-[10px]">ADMIN</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Lock className="h-4 w-4" /> Change Password</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowCurrent(!showCurrent)}>
                    {showCurrent ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <div className="relative">
                    <Input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                    />
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowNew(!showNew)}>
                      {showNew ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                  />
                </div>
              </div>
              <Button onClick={handleChangePassword} disabled={changing} size="sm">
                {changing ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Changing...</> : "Change Password"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* M-Pesa Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" /> M-Pesa Configuration</CardTitle>
          <CardDescription>Payment gateway settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Environment</p>
              <Badge variant="outline" className="text-[10px]">Sandbox</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Passkey</p>
              <p className="font-mono text-xs">••••••••••••</p>
            </div>
            <div>
              <p className="text-muted-foreground">Business Short Code</p>
              <p className="font-mono text-xs">174379</p>
            </div>
            <div>
              <p className="text-muted-foreground">Callback URL</p>
              <p className="font-mono text-xs truncate">/api/mpesa/callback</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Configure via environment variables. Contact support to update production credentials.
          </p>
        </CardContent>
      </Card>

      {/* Placeholder Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="opacity-60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4" /> Email Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">SMTP and email template settings. Coming soon.</p>
          </CardContent>
        </Card>
        <Card className="opacity-60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Wrench className="h-4 w-4" /> Maintenance Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Toggle maintenance mode for the platform. Coming soon.</p>
          </CardContent>
        </Card>
        <Card className="opacity-60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Key className="h-4 w-4" /> API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Manage API keys and integrations. Coming soon.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
