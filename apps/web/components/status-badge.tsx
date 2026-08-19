export type BadgeTone = "neutral" | "success" | "danger" | "warning";

export function StatusBadge({
  tone = "neutral",
  children
}: {
  tone?: BadgeTone;
  children: string;
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
