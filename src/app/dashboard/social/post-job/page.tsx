"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import PosterPreview from "@/components/poster-preview";
import {
  Search, Send, Briefcase, Building2, MapPin, Clock,
  Facebook, Instagram, Linkedin, Twitter, MessageCircle, Activity,
  Palette, FileEdit, Sparkles
} from "lucide-react";

interface ListingItem {
  id: string;
  title: string;
  status: string;
  employmentType: string;
  town: string;
  county: string;
  company: { id: string; name: string; logo: string | null };
}

interface SocialAccount {
  id: string;
  platform: string;
  pageName: string | null;
  platformUsername: string | null;
  isActive: boolean;
}

const TEMPLATES = [
  { value: "modern", label: "Modern", description: "Clean modern design with bold colors" },
  { value: "minimal", label: "Minimal", description: "Simple and elegant layout" },
  { value: "corporate", label: "Corporate", description: "Professional business style" },
];

function PlatformIcon({ platform, className = "h-5 w-5" }: { platform: string; className?: string }) {
  switch (platform) {
    case "FACEBOOK": return <Facebook className={className} />;
    case "INSTAGRAM": return <Instagram className={className} />;
    case "LINKEDIN": return <Linkedin className={className} />;
    case "TWITTER": return <Twitter className={className} />;
    case "WHATSAPP": return <MessageCircle className={className} />;
    default: return <Activity className={className} />;
  }
}

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  TWITTER: "Twitter",
  WHATSAPP: "WhatsApp",
};

export default function PostJobPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState<ListingItem | null>(null);
  const [showListingSearch, setShowListingSearch] = useState(true);

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  const [template, setTemplate] = useState("modern");
  const [caption, setCaption] = useState("");
  const [customCaption, setCustomCaption] = useState(false);

  const [posting, setPosting] = useState(false);

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  // Fetch listings
  const fetchListings = useCallback(async () => {
    if (!debouncedSearch) return;
    setListingsLoading(true);
    try {
      const params = new URLSearchParams({
        q: debouncedSearch,
        status: "ACTIVE",
        limit: "10",
      });
      const res = await fetch(`/api/admin/listings?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setListings(data.listings || []);
    } catch {
      toast.error("Failed to search listings");
    } finally {
      setListingsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  // Fetch accounts
  const fetchAccounts = useCallback(async () => {
    setAccountsLoading(true);
    try {
      const res = await fetch("/api/admin/social/accounts?active=true");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAccounts((data.accounts || []).filter((a: SocialAccount) => a.isActive));
    } catch {
      toast.error("Failed to load social accounts");
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  // Generate caption when listing is selected
  useEffect(() => {
    if (selectedListing && !customCaption) {
      const location = [selectedListing.town, selectedListing.county].filter(Boolean).join(", ");
      const defaultCaption = `${selectedListing.company?.name || ""} is hiring: ${selectedListing.title}\n\n📍 ${location}\n💼 ${selectedListing.employmentType}\n\nApply now on JobReady! #JobsInKenya #JobReady`;
      setCaption(defaultCaption);
    }
  }, [selectedListing, customCaption]);

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handlePost = async () => {
    if (!selectedListing) {
      toast.error("Please select a listing");
      return;
    }
    if (selectedAccounts.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    setPosting(true);
    try {
      const res = await fetch("/api/admin/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: selectedListing.id,
          accountIds: selectedAccounts,
          caption,
          posterTemplate: template,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create posts");
      }

      const data = await res.json();
      toast.success(`Successfully created ${data.posts?.length || 1} post(s) across ${selectedAccounts.length} platform(s)`);

      // Reset form
      setSelectedListing(null);
      setSelectedAccounts([]);
      setCaption("");
      setCustomCaption(false);
      setTemplate("modern");
      setShowListingSearch(true);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to post";
      toast.error(msg);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Post a Job</h1>
          <p className="text-muted-foreground">Share a job listing to social media</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Select Listing */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <CardTitle className="text-base">Select a Listing</CardTitle>
                  <CardDescription>Choose a published job listing to share</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showListingSearch || !selectedListing ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search for a job listing..."
                      className="pl-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  {listingsLoading && (
                    <div className="space-y-2">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  )}
                  {!listingsLoading && debouncedSearch && listings.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <p className="text-sm">No active listings found matching &quot;{debouncedSearch}&quot;</p>
                    </div>
                  )}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {listings.map((listing) => (
                      <div
                        key={listing.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-slate-50 ${
                          selectedListing?.id === listing.id ? "border-primary bg-primary/5" : ""
                        }`}
                        onClick={() => {
                          setSelectedListing(listing);
                          setShowListingSearch(false);
                        }}
                      >
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="h-5 w-5 text-slate-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{listing.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {listing.company?.name}
                            </span>
                            {listing.town && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {listing.town}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 flex-shrink-0">
                          {listing.employmentType}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                selectedListing && (
                  <div className="flex items-start gap-4 p-4 rounded-lg border bg-primary/5">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm">{selectedListing.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {selectedListing.company?.name}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {[selectedListing.town, selectedListing.county].filter(Boolean).join(", ") || "N/A"}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {selectedListing.employmentType}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setSelectedListing(null);
                        setShowListingSearch(true);
                        setSearch("");
                      }}
                    >
                      Change
                    </Button>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* Step 2: Select Platforms */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <CardTitle className="text-base">Choose Platforms</CardTitle>
                  <CardDescription>Select which social accounts to post to</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {accountsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-6">
                  <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No active social accounts found</p>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = "/dashboard/social"}>
                    Connect an account
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedAccounts.includes(account.id) ? "border-primary bg-primary/5" : "hover:bg-slate-50"
                      }`}
                      onClick={() => toggleAccount(account.id)}
                    >
                      <Checkbox checked={selectedAccounts.includes(account.id)} />
                      <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
                        <PlatformIcon platform={account.platform} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {PLATFORM_LABELS[account.platform] || account.platform}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {account.pageName || account.platformUsername || "Connected account"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Configure Post */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <CardTitle className="text-base">Configure Post</CardTitle>
                  <CardDescription>Customize the poster template and caption</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Selector */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Palette className="h-4 w-4" />
                  Poster Template
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {TEMPLATES.map((t) => (
                    <div
                      key={t.value}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors text-center ${
                        template === t.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "hover:bg-slate-50"
                      }`}
                      onClick={() => setTemplate(t.value)}
                    >
                      <div className={`h-16 rounded-md mb-2 flex items-center justify-center ${
                        t.value === "modern" ? "bg-gradient-to-br from-violet-500 to-fuchsia-500" :
                        t.value === "minimal" ? "bg-gradient-to-br from-slate-700 to-slate-900" :
                        "bg-gradient-to-br from-sky-600 to-blue-800"
                      }`}>
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-sm font-medium">{t.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{t.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Caption */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5">
                    <FileEdit className="h-4 w-4" />
                    Caption
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      if (!customCaption && selectedListing) {
                        const location = [selectedListing.town, selectedListing.county].filter(Boolean).join(", ");
                        setCaption(`${selectedListing.company?.name || ""} is hiring: ${selectedListing.title}\n\n📍 ${location}\n💼 ${selectedListing.employmentType}\n\nApply now on JobReady! #JobsInKenya #JobReady`);
                      }
                      setCustomCaption(!customCaption);
                    }}
                  >
                    {customCaption ? "Reset to default" : "Edit caption"}
                  </Button>
                </div>
                <Textarea
                  placeholder="Post caption will be generated when you select a listing..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  disabled={!selectedListing}
                  rows={5}
                  className={!selectedListing ? "opacity-50" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  {caption.length} / 2200 characters
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          <Card className="sticky top-20">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Preview</CardTitle>
              <CardDescription>Poster preview will appear here</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PosterPreview
                listing={selectedListing ? {
                  title: selectedListing.title,
                  company: selectedListing.company?.name,
                  location: [selectedListing.town, selectedListing.county].filter(Boolean).join(", "),
                } : undefined}
              />

              {/* Selected Platforms Summary */}
              {selectedAccounts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    Posting to {selectedAccounts.length} platform{selectedAccounts.length > 1 ? "s" : ""}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {accounts
                      .filter((a) => selectedAccounts.includes(a.id))
                      .map((a) => (
                        <Badge key={a.id} variant="secondary" className="text-[10px] gap-1">
                          <PlatformIcon platform={a.platform} className="h-3 w-3" />
                          {PLATFORM_LABELS[a.platform]}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handlePost}
                disabled={posting || !selectedListing || selectedAccounts.length === 0}
              >
                {posting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Post Now
                  </>
                )}
              </Button>

              <p className="text-[10px] text-muted-foreground text-center">
                Posts will be created and can be reviewed in Post History
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
