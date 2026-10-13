"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  fallbackAuthor?: string;
}

export function SafeImage({
  src,
  alt,
  className = "",
  fallbackTitle,
  fallbackAuthor,
}: SafeImageProps) {
  const [hasError, setHasError] = useState(!src);

  if (!src || hasError) {
    return (
      <div
        className={`bg-gradient-to-tr from-slate-900 via-indigo-950 to-rose-950 p-3 flex flex-col justify-between items-center text-center select-none ${className}`}
      >
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-rose-400 mt-auto mb-2">
          <Sparkles className="w-4 h-4" />
        </div>
        {fallbackTitle && (
          <span className="font-black text-xs text-white/95 leading-tight line-clamp-3 mb-1">
            {fallbackTitle}
          </span>
        )}
        {fallbackAuthor && (
          <span className="text-[10px] text-white/60 mb-auto">{fallbackAuthor}</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={className}
      loading="lazy"
    />
  );
}
