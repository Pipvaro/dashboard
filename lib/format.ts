export const fmtMoney = (n?: number, ccy = "USD") =>
  typeof n === "number"
    ? new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: ccy,
        maximumFractionDigits: 2,
      }).format(n)
    : "—";

export const fmtNumber = (n?: number, d = 0) =>
  typeof n === "number"
    ? new Intl.NumberFormat(undefined, { maximumFractionDigits: d }).format(n)
    : "—";

export const timeAgo = (iso?: string) => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};
