import { cn } from "@/lib/cn";

const bar = "rounded-md bg-surface-2";

/**
 * Shown in the content area while a backend page loads (admin-content-table
 * D8, see `PendingContent`); the navigation around it stays as it is. `role="status"` announces it,
 * and the pulse is switched off by the site-wide reduced-motion rule.
 */
export function LoadingPlaceholder({ shape = "page" }: { shape?: "page" | "table" }) {
  return (
    <div role="status" className="animate-pulse">
      <span className="sr-only">Laden…</span>
      <div aria-hidden="true">
        <div className={cn(bar, "h-9 w-56")} />
        {shape === "table" ? (
          <>
            <div className={cn(bar, "mt-6 h-10 w-full max-w-xl")} />
            <div className="mt-6 grid gap-2">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className={cn(bar, "h-12 w-full")} />
              ))}
            </div>
          </>
        ) : (
          <div className="mt-8 grid gap-4">
            <div className={cn(bar, "h-24 w-full")} />
            <div className={cn(bar, "h-24 w-full")} />
            <div className={cn(bar, "h-40 w-full")} />
          </div>
        )}
      </div>
    </div>
  );
}
