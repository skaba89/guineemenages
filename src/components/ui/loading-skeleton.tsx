'use client';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Skeleton pour carte KPI
export function KPICardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
      <div className="mt-4">
        <Skeleton className="h-8 w-full rounded" />
      </div>
    </div>
  );
}

// Skeleton pour tableau
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="border-b bg-muted/30 p-4">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      {/* Rows */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 p-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton pour liste d'éléments
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3 animate-fade-in">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Skeleton pour formulaire
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  );
}

// Skeleton pour graphique donut
export function DonutChartSkeleton() {
  return (
    <div className="flex items-center justify-center p-6 animate-fade-in">
      <div className="relative">
        <Skeleton className="h-40 w-40 rounded-full" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="h-20 w-20 rounded-full bg-card" />
        </div>
      </div>
    </div>
  );
}

// Skeleton pour timeline
export function TimelineSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="space-y-4 animate-fade-in">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <Skeleton className="h-3 w-3 rounded-full" />
            {i < items - 1 && <Skeleton className="h-12 w-0.5 mt-2" />}
          </div>
          <div className="flex-1 space-y-2 pb-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton pour carte avec contenu
export function CardSkeleton({ hasHeader = true }: { hasHeader?: boolean }) {
  return (
    <div className="rounded-xl border bg-card shadow-sm animate-fade-in">
      {hasHeader && (
        <div className="border-b p-4">
          <Skeleton className="h-5 w-32" />
        </div>
      )}
      <div className="p-6 space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

// Skeleton pour dashboard complet
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Card */}
        <div className="lg:col-span-2">
          <CardSkeleton />
        </div>
        {/* Side Cards */}
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>

      {/* Bottom Section */}
      <CardSkeleton />
    </div>
  );
}

// Skeleton pour page de liste
export function PageListSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64 rounded-md" />
        <Skeleton className="h-10 w-40 rounded-md" />
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>

      {/* Table */}
      <TableSkeleton />
    </div>
  );
}

// Pulse animation personnalisée pour skeleton
export function PulseLoader({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

// Skeleton pour sparkline
export function SparklineSkeleton() {
  return (
    <div className="flex items-end gap-0.5 h-8 animate-pulse">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-muted-foreground/20 rounded-sm"
          style={{ height: `${20 + Math.random() * 80}%` }}
        />
      ))}
    </div>
  );
}
