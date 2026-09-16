export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-24 sm:pb-12">
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="aspect-[4/3] animate-pulse rounded-xl bg-[#1A1A1A]/5" />

        <div className="mt-6 space-y-3">
          <div className="h-8 w-3/4 animate-pulse rounded bg-[#1A1A1A]/5" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-[#1A1A1A]/5" />
          <div className="h-8 w-40 animate-pulse rounded bg-[#1A1A1A]/5" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-y border-[#1A1A1A]/10 py-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 animate-pulse rounded bg-[#1A1A1A]/5" />
              <div className="h-4 w-12 animate-pulse rounded bg-[#1A1A1A]/5" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

