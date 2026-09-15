const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/**
 * Formats a raw naira amount (as a plain number, e.g. 150000000) into
 * "₦150,000,000". Uses Intl.NumberFormat rather than manual string
 * splitting so locale separators and the currency glyph are always correct.
 */
export function formatNaira(amountNaira: number): string {
  return nairaFormatter.format(amountNaira);
}

/**
 * Compact form for cards/badges where space is tight, e.g. "₦150M" instead
 * of "₦150,000,000". Falls back to the full format under ₦1m since "₦500K"
 * style abbreviations read as less trustworthy for property price points.
 */
export function formatNairaCompact(amountNaira: number): string {
  if (amountNaira >= 1_000_000_000) {
    return `₦${(amountNaira / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  }
  if (amountNaira >= 1_000_000) {
    return `₦${(amountNaira / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  return formatNaira(amountNaira);
}
