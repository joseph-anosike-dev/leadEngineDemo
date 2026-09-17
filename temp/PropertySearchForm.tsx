import { BUDGET_LABELS } from "@/lib/schemas";

interface PropertySearchFormProps {
  defaultValues: {
    state?: string;
    minBedrooms?: string;
    budget?: string;
  };
}

/**
 * Deliberately a plain server-rendered <form method="get">, not a client
 * component. Submitting reloads the page with query params attached
 * (e.g. /?state=Lagos&minBedrooms=3), which app/page.tsx reads directly via
 * its `searchParams` prop and uses to build the Supabase query. No client
 * JS, no hydration cost — keeps this fast on the mobile networks the brief
 * cares about, and works even with JS disabled.
 */
export function PropertySearchForm({
  defaultValues,
}: PropertySearchFormProps) {
  return (
    <form
      method="get"
      action="/"
      className="grid grid-cols-2 gap-3 border border-[#1A1A1A]/10 bg-white p-4 sm:grid-cols-4"
    >
      <div className="col-span-2 sm:col-span-1">
        <label
          htmlFor="state"
          className="mb-1 block text-xs font-medium text-[#1A1A1A]/70"
        >
          State
        </label>
        <input
          id="state"
          name="state"
          type="text"
          defaultValue={defaultValues.state}
          placeholder="e.g. Lagos"
          className="w-full rounded-lg border border-[#1A1A1A]/15 px-3 py-2 text-sm outline-none focus:border-[#B8963E] focus:ring-1 focus:ring-[#B8963E]"
        />
      </div>

      <div>
        <label
          htmlFor="minBedrooms"
          className="mb-1 block text-xs font-medium text-[#1A1A1A]/70"
        >
          Bedrooms
        </label>
        <select
          id="minBedrooms"
          name="minBedrooms"
          defaultValue={defaultValues.minBedrooms ?? ""}
          className="w-full rounded-lg border border-[#1A1A1A]/15 px-3 py-2 text-sm outline-none focus:border-[#B8963E] focus:ring-1 focus:ring-[#B8963E]"
        >
          <option value="">Any</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="budget"
          className="mb-1 block text-xs font-medium text-[#1A1A1A]/70"
        >
          Budget
        </label>
        <select
          id="budget"
          name="budget"
          defaultValue={defaultValues.budget ?? ""}
          className="w-full rounded-lg border border-[#1A1A1A]/15 px-3 py-2 text-sm outline-none focus:border-[#B8963E] focus:ring-1 focus:ring-[#B8963E]"
        >
          <option value="">Any</option>
          {Object.entries(BUDGET_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end">
        <button
          type="submit"
          className="w-full rounded-lg bg-[#7A1F1F] px-4 py-2 text-sm font-medium text-white"
        >
          Search
        </button>
      </div>
    </form>
  );
}
