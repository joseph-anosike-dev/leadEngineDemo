```tsx
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <header className="border-b border-[#1A1A1A]/10 bg-[#1A1A1A] px-4 py-10 text-center sm:py-14">
        <div className="mx-auto h-8 w-72 animate-pulse rounded bg-white/10" />
        <div className="mx-auto mt-3 h-4 w-80 animate-pulse rounded bg-white/10" />
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-[#1A1A1A]/10 bg-white"
            >
              <div className="aspect-[4/3] animate-pulse bg-[#1A1A1A]/5" />

              <div className="space-y-3 p-4">
                <div className="h-6 w-32 animate-pulse rounded bg-[#1A1A1A]/5" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-[#1A1A1A]/5" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-[#1A1A1A]/5" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
```
