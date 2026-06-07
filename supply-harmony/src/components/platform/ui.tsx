import { cn } from "@/lib/utils";
import type { Risk } from "@/lib/mock-data";

const riskStyles: Record<Risk, { dot: string; text: string; bg: string; label: string }> = {
  alto: { dot: "bg-destructive", text: "text-destructive", bg: "bg-destructive/10", label: "Riesgo alto" },
  medio: { dot: "bg-warning", text: "text-warning", bg: "bg-warning/12", label: "Riesgo medio" },
  bajo: { dot: "bg-success", text: "text-success", bg: "bg-success/12", label: "Estable" },
};

export function RiskBadge({ risk, label, className }: { risk: Risk; label?: string; className?: string }) {
  const s = riskStyles[risk];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        s.bg,
        s.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {label ?? s.label}
    </span>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
