"use client";

import { useState } from "react";
import Image from "next/image";
import type { Credential } from "@/types/database";

interface CredentialsListProps {
  creds: Credential[];
}

export function CredentialsList({ creds }: CredentialsListProps) {
  const [openDocument, setOpenDocument] = useState<Credential | null>(null);

  if (creds.length === 0) {
    return null;
  }

  return (
    <>
      <ul className="divide-y divide-[#1A1A1A]/10 border border-[#1A1A1A]/10">
        {creds.map((cred) => (
          <li
            key={cred.label}
            className="flex items-center justify-between gap-4 p-4"
          >
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">
                {cred.label}
              </p>
              <p className="text-xs text-[#1A1A1A]/50">
                {cred.reference_number}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpenDocument(cred)}
              className="whitespace-nowrap border border-[#B8963E] px-3 py-1.5 text-xs font-medium text-[#7A1F1F]"
            >
              View certificate
            </button>
          </li>
        ))}
      </ul>

      {openDocument && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${openDocument.label} certificate`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpenDocument(null)}
        >
          <button
            type="button"
            onClick={() => setOpenDocument(null)}
            aria-label="Close"
            className="absolute right-4 top-4 text-2xl text-white"
          >
            ✕
          </button>
          <div className="relative h-full w-full max-w-2xl">
            <Image
              src={openDocument.document_url}
              alt={`${openDocument.label} certificate`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </>
  );
}