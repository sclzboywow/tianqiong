"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ArtifactStatusOption, DisplayOption } from "@/game/contentDisplayLabels";
import { formatSelectOptionLabel } from "@/game/contentDisplayLabels";

export function SlugHint({
  slug,
  className,
}: {
  slug?: string | null;
  className?: string;
}) {
  if (!slug) return null;
  return (
    <span className={cn("font-mono text-[10px] text-zinc-500", className)}>{slug}</span>
  );
}

export function DisplayTitle({
  title,
  slug,
  className,
}: {
  title: string;
  slug?: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-zinc-100">{title}</p>
      {slug ? <SlugHint slug={slug} className="mt-0.5 block" /> : null}
    </div>
  );
}

export function DisplayNativeSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: DisplayOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <select
      className={cn(
        "rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100",
        className,
      )}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      {placeholder ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {formatSelectOptionLabel(option)}
        </option>
      ))}
    </select>
  );
}

export function ArtifactStatusSelect({
  value,
  onChange,
  statusOptions,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  statusOptions: ArtifactStatusOption[];
  className?: string;
}) {
  return (
    <select
      className={cn(
        "rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100",
        className,
      )}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {statusOptions.map((option) => (
        <option key={option.status} value={option.status}>
          {option.label}
          {option.label !== option.status ? `（${option.status}）` : ""}
        </option>
      ))}
    </select>
  );
}

export function DisplayOptionListItem({
  label,
  slug,
  meta,
}: {
  label: ReactNode;
  slug?: string | null;
  meta?: ReactNode;
}) {
  return (
    <div>
      <div className="text-sm text-zinc-200">{label}</div>
      {slug ? <SlugHint slug={slug} className="mt-0.5 block" /> : null}
      {meta ? <div className="mt-0.5 text-xs text-zinc-500">{meta}</div> : null}
    </div>
  );
}
