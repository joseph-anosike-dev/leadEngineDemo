"use client";

import { useState } from "react";
import Image from "next/image";
import type { PropertyMediaItem } from "@/types/database";

interface PropertyMediaGalleryProps {
  media: PropertyMediaItem[];
  propertyTitle: string;
}

export function PropertyMediaGallery({
  media,
  propertyTitle,
}: PropertyMediaGalleryProps) {
  const sortedMedia = [...media].sort((a, b) => a.order - b.order);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (sortedMedia.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-[#1A1A1A]/5 text-sm text-[#1A1A1A]/40">
        No photos available
      </div>
    );
  }

  const activeImage = sortedMedia[activeIndex];

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsLightboxOpen(true)}
        className="block w-full overflow-hidden rounded-xl"
      >
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={activeImage.url}
            alt={activeImage.alt || propertyTitle}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 700px"
            priority={activeIndex === 0}
          />
        </div>
      </button>

      {sortedMedia.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {sortedMedia.map((item, index) => (
            <button
              key={item.url}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                index === activeIndex
                  ? "border-[#B8963E]"
                  : "border-transparent"
              }`}
            >
              <Image
                src={item.url}
                alt={item.alt || `${propertyTitle} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close gallery"
            className="absolute right-4 top-4 text-2xl text-white"
          >
            ✕
          </button>
          <div className="relative h-full w-full max-w-4xl">
            <Image
              src={activeImage.url}
              alt={activeImage.alt || propertyTitle}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </div>
  );
}
