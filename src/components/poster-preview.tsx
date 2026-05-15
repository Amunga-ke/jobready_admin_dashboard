"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, MapPin, Building2, ImageIcon } from "lucide-react";

interface PosterPreviewProps {
  posterUrl?: string;
  posterBase64?: string;
  listing?: { title: string; company?: string; location?: string };
  className?: string;
}

export default function PosterPreview({ posterUrl, posterBase64, listing, className = "" }: PosterPreviewProps) {
  const src = posterBase64 ? `data:image/png;base64,${posterBase64}` : posterUrl;

  if (src) {
    return (
      <div className={`rounded-lg overflow-hidden border bg-white ${className}`}>
        <img
          src={src}
          alt="Job poster"
          className="w-full h-auto object-contain"
        />
      </div>
    );
  }

  // Placeholder poster
  return (
    <div className={`rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 ${className}`}>
      <div className="flex flex-col items-center justify-center p-8 min-h-[280px]">
        <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center mb-4">
          <ImageIcon className="h-8 w-8 text-slate-400" />
        </div>
        <div className="text-center max-w-[260px]">
          {listing?.title && (
            <h4 className="font-semibold text-sm text-slate-700 mb-2 line-clamp-2">
              {listing.title}
            </h4>
          )}
          <div className="space-y-1 text-xs text-slate-500">
            {listing?.company && (
              <div className="flex items-center gap-1.5 justify-center">
                <Building2 className="h-3 w-3" />
                <span>{listing.company}</span>
              </div>
            )}
            {listing?.location && (
              <div className="flex items-center gap-1.5 justify-center">
                <MapPin className="h-3 w-3" />
                <span>{listing.location}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Poster will be generated when you post
          </p>
        </div>
      </div>
    </div>
  );
}
