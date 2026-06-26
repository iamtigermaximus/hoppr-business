"use client";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export function BarErrorBoundary({ children, label }: { children: React.ReactNode; label?: string }) {
  return <ErrorBoundary label={label ?? "This page"}>{children}</ErrorBoundary>;
}
