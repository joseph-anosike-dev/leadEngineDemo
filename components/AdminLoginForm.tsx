"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Incorrect email or password.");
      setIsSubmitting(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm"
    >
      <h1 className="mb-1 text-lg font-semibold text-[#1A1A1A]">
        Agent Login
      </h1>
      <p className="mb-5 text-sm text-[#1A1A1A]/60">
        Sign in to view your leads and viewing requests.
      </p>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-[#1A1A1A]"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-[#1A1A1A]/15 px-4 py-3 text-sm outline-none focus:border-[#B8963E] focus:ring-1 focus:ring-[#B8963E]"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-[#1A1A1A]"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-[#1A1A1A]/15 px-4 py-3 text-sm outline-none focus:border-[#B8963E] focus:ring-1 focus:ring-[#B8963E]"
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-[#7A1F1F]/5 px-4 py-2 text-sm text-[#7A1F1F]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full rounded-lg bg-[#7A1F1F] px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
