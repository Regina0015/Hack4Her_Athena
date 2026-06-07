import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand shadow-brand">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary-foreground" fill="none">
          {/* Oráculo / estrella Pythia */}
          <path
            d="M12 3.2l2.2 4.7 5.1.7-3.7 3.5.9 5.1-4.5-2.4-4.5 2.4.9-5.1L4.7 8.6l5.1-.7z"
            fill="currentColor"
          />
        </svg>
      </div>
      {!compact && (
        <div className="leading-none">
          <p className="text-[15px] font-extrabold tracking-tight text-foreground">Pythia</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Arca Continental
          </p>
        </div>
      )}
    </div>
  );
}
