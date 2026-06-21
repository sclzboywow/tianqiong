import type { ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ConfigSource } from "@/game/contentOrchestrationLoader";
import { payloadAdminUrl } from "@/lib/payloadAdminUrl";

export function adminLink(
  collection: string,
  docId?: string | number,
  slug?: string,
): { href: string; missing: boolean } {
  if (docId != null) {
    return { href: payloadAdminUrl(collection, docId), missing: false };
  }
  return {
    href: payloadAdminUrl(collection),
    missing: Boolean(slug),
  };
}

export function sourceBadge(source: ConfigSource) {
  if (source === "payload") {
    return <Badge className="text-xs">payload</Badge>;
  }
  if (source === "mismatch") {
    return (
      <Badge variant="outline" className="border-amber-600 text-amber-300 text-xs">
        mismatch
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs text-zinc-400">
      seedFallback
    </Badge>
  );
}

export function TabLoading({ label }: { label: string }) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/80">
      <CardContent className="p-8 text-center text-sm text-zinc-400">{label}</CardContent>
    </Card>
  );
}

export function TabError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="border-rose-900/40 bg-rose-950/10">
      <CardContent className="space-y-3 p-6 text-sm text-rose-200">
        <p>{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          重试
        </button>
      </CardContent>
    </Card>
  );
}

export function PayloadEditLink({
  collection,
  docId,
  slug,
  label = "编辑 Payload",
}: {
  collection: string;
  docId?: string | number;
  slug?: string;
  label?: string;
}) {
  const link = adminLink(collection, docId, slug);
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noreferrer"
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs")}
    >
      {label}
    </a>
  );
}

export function InspectorField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <div className={cn("text-sm text-zinc-200", mono && "font-mono text-xs break-all")}>
        {value ?? "—"}
      </div>
    </div>
  );
}

export function SelectableCard({
  selected,
  onClick,
  className,
  children,
}: {
  selected?: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "w-full cursor-pointer rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-sky-600/60 bg-sky-950/20 ring-1 ring-sky-600/40"
          : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 hover:bg-zinc-900/80",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function RiskDots({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <Badge variant="outline" className="border-rose-700 text-rose-300 text-xs">
      {count} 风险
    </Badge>
  );
}

export function DebugTaskLink({ slug }: { slug: string }) {
  return (
    <Link
      href={`/ops/content-studio?tab=debug&task=${slug}`}
      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs")}
    >
      依赖调试
    </Link>
  );
}
