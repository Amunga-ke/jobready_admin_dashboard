"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatRelativeTime, formatDate, formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import {
  Search, MoreHorizontal, Eye, Pencil, ShieldAlert, UserX, UserCheck,
  ChevronLeft, ChevronRight, Users, Shield, Briefcase, Building2
} from "lucide-react";

interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  county: string | null;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  avatarUrl: string | null;
  _count: { applications: number };
}

interface UserDetail extends UserListItem {
  bio: string | null;
  phone: string | null;
  cvUrl: string | null;
  employerProfile: {
    id: string;
    role: string;
    isVerified: boolean;
    createdAt: string;
    company: {
      id: string;
      name: string;
      logo: string | null;
      verified: boolean;
      industry: string | null;
      county: string | null;
      _count: { listings: number; teamMembers: number };
      subscriptions: {
        id: string;
        status: string;
        plan: { name: string };
        currentPeriodEnd: string;
      }[];
      jobCredit: {
        id: string;
        balance: number;
        totalPurchased: number;
        totalUsed: number;
      } | null;
    };
  } | null;
  _count: { applications: number; savedJobs: number; jobAlerts: number; teamMemberships: number };
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  EMPLOYER: "bg-blue-100 text-blue-700",
  SEEKER: "bg-green-100 text-green-700",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editUser, setEditUser] = useState<UserListItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [roleDialogUser, setRoleDialogUser] = useState<UserListItem | null>(null);
  const [newRole, setNewRole] = useState("");
  const limit = 20;

  // Debounce search
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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (role) params.set("role", role);
    if (status) params.set("status", status);

    try {
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, role, status, limit]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const totalPages = Math.ceil(total / limit);

  const fetchUserDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSelectedUser(data);
    } catch {
      toast.error("Failed to fetch user details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleActive = async (user: UserListItem) => {
    const action = user.isActive ? "deactivate" : "activate";
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(`User ${action}d successfully`);
      fetchUsers();
    } catch {
      toast.error(`Failed to ${action} user`);
    }
  };

  const handleRoleChange = async () => {
    if (!roleDialogUser || !newRole) return;
    try {
      const res = await fetch(`/api/admin/users/${roleDialogUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Role changed to ${newRole}`);
      setRoleDialogUser(null);
      setNewRole("");
      fetchUsers();
    } catch {
      toast.error("Failed to change role");
    }
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      if (!res.ok) throw new Error();
      toast.success("User updated successfully");
      setEditUser(null);
      fetchUsers();
    } catch {
      toast.error("Failed to update user");
    }
  };

  // Pagination numbers
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
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
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage all platform users</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name or email..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-14 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Users</p>
                <p className="text-lg font-bold">{total.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Seekers</p>
                <p className="text-lg font-bold">{users.filter(u => u.role === "SEEKER").length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Employers</p>
                <p className="text-lg font-bold">{users.filter(u => u.role === "EMPLOYER").length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center">
                <Shield className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Admins</p>
                <p className="text-lg font-bold">{users.filter(u => u.role === "ADMIN").length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Role Tabs */}
      <Tabs value={role || "all"} onValueChange={(v) => { setRole(v === "all" ? "" : v); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="SEEKER">Seekers</TabsTrigger>
          <TabsTrigger value="EMPLOYER">Employers</TabsTrigger>
          <TabsTrigger value="ADMIN">Admins</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">County</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
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
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">No users found</p>
                      <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                            <AvatarFallback className="text-xs bg-slate-100 text-slate-600">
                              {(user.name || "U").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{user.name || "N/A"}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${ROLE_COLORS[user.role] || "bg-gray-100 text-gray-700"}`} variant="outline">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{user.county || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "destructive"} className="text-[10px]">
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {formatRelativeTime(user.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => fetchUserDetail(user.id)}>
                              <Eye className="h-4 w-4 mr-2" />View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setEditUser(user); setEditName(user.name); }}>
                              <Pencil className="h-4 w-4 mr-2" />Edit Name
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setRoleDialogUser(user); setNewRole(user.role); }}>
                              <ShieldAlert className="h-4 w-4 mr-2" />Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.isActive ? (
                              <DropdownMenuItem onClick={() => handleToggleActive(user)} className="text-orange-600">
                                <UserX className="h-4 w-4 mr-2" />Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleToggleActive(user)} className="text-green-600">
                                <UserCheck className="h-4 w-4 mr-2" />Activate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      {/* View User Detail Dialog */}
      <Dialog open={!!selectedUser || detailLoading} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : selectedUser && (
            <div className="space-y-4">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  {selectedUser.avatarUrl && <AvatarImage src={selectedUser.avatarUrl} alt={selectedUser.name} />}
                  <AvatarFallback className="bg-slate-100 text-slate-600">
                    {(selectedUser.name || "U").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{selectedUser.name || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-[10px] ${ROLE_COLORS[selectedUser.role] || ""}`} variant="outline">
                      {selectedUser.role}
                    </Badge>
                    <Badge variant={selectedUser.isActive ? "default" : "destructive"} className="text-[10px]">
                      {selectedUser.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {selectedUser.emailVerified && (
                      <Badge className="text-[10px] bg-green-100 text-green-700" variant="outline">Verified</Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Phone</p>
                  <p className="font-medium">{selectedUser.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">County</p>
                  <p className="font-medium">{selectedUser.county || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Joined</p>
                  <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Last Updated</p>
                  <p className="font-medium">{formatDateTime(selectedUser.createdAt)}</p>
                </div>
              </div>

              {selectedUser.bio && (
                <div>
                  <p className="text-muted-foreground text-xs">Bio</p>
                  <p className="text-sm mt-1">{selectedUser.bio}</p>
                </div>
              )}

              {/* Activity Summary */}
              <Separator />
              <div>
                <p className="text-sm font-semibold mb-2">Activity Summary</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedUser._count.applications} applications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedUser._count.savedJobs} saved jobs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedUser._count.jobAlerts} job alerts</span>
                  </div>
                  {selectedUser.role === "EMPLOYER" && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedUser._count.teamMemberships} team memberships</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Employer Company Info */}
              {selectedUser.employerProfile && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-2">Company Profile</p>
                    <Card>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium">{selectedUser.employerProfile.company.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {selectedUser.employerProfile.company.industry || "No industry"} · {selectedUser.employerProfile.company.county || "No location"}
                            </p>
                          </div>
                          <Badge variant={selectedUser.employerProfile.company.verified ? "default" : "outline"} className="text-[10px] ml-auto">
                            {selectedUser.employerProfile.company.verified ? "Verified" : "Unverified"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground pt-2">
                          <div>{selectedUser.employerProfile.company._count.listings} listings</div>
                          <div>{selectedUser.employerProfile.company._count.teamMembers} members</div>
                          <div>
                            Credits: {selectedUser.employerProfile.company.jobCredit?.balance ?? 0}
                          </div>
                        </div>
                        {selectedUser.employerProfile.company.subscriptions[0] && (
                          <p className="text-xs text-muted-foreground">
                            Plan: <span className="font-medium text-foreground">{selectedUser.employerProfile.company.subscriptions[0].plan.name}</span>
                            {" · "}
                            <Badge variant={selectedUser.employerProfile.company.subscriptions[0].status === "ACTIVE" ? "default" : "outline"} className="text-[10px]">
                              {selectedUser.employerProfile.company.subscriptions[0].status}
                            </Badge>
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Name Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user&apos;s name</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleEditSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={!!roleDialogUser} onOpenChange={() => setRoleDialogUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Change role for <span className="font-medium">{roleDialogUser?.name || roleDialogUser?.email}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEEKER">Seeker</SelectItem>
                  <SelectItem value="EMPLOYER">Employer</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogUser(null)}>Cancel</Button>
            <Button onClick={handleRoleChange} disabled={newRole === roleDialogUser?.role}>
              Change Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
