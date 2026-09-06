// src/components/common/Skeleton.tsx
// Har bir sahifaning skeleton (yuklanish) ko'rinishini qurish uchun qayta
// ishlatiladigan bo'laklar. Barchasi shu faylga to'plangan — sahifalar
// o'zining haqiqiy tarkibiga mos ravishda shulardan tuzadi.
import { cn } from "@/lib/utils";

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-xl bg-gray-200 dark:bg-white/10", className)} />
);

export const SkeletonAvatar = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-full bg-gray-200 dark:bg-white/10", className)} />
);

export const SkeletonText = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-white/10 h-3.5", className)} />
);

export const SkeletonHeader = () => (
  <div className="space-y-2">
    <SkeletonText className="w-40 h-7 sm:h-8" />
    <SkeletonText className="w-56 h-4" />
  </div>
);

export const SkeletonStatGrid = ({ count = 4 }: { count?: number }) => (
  <div className={cn("grid gap-3 md:gap-4", count % 3 === 0 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4")}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card p-4 md:p-5 text-center space-y-2">
        <SkeletonAvatar className="w-10 h-10 mx-auto" />
        <SkeletonText className="w-12 h-5 mx-auto" />
        <SkeletonText className="w-16 h-3 mx-auto" />
      </div>
    ))}
  </div>
);

export const SkeletonListRow = ({ withAvatar = true }: { withAvatar?: boolean }) => (
  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
    {withAvatar && <SkeletonAvatar className="w-10 h-10 flex-shrink-0" />}
    <div className="flex-1 space-y-2 min-w-0">
      <SkeletonText className="w-1/2" />
      <SkeletonText className="w-1/3 h-3" />
    </div>
    <SkeletonText className="w-12 h-5 flex-shrink-0" />
  </div>
);

export const SkeletonList = ({ rows = 4, withAvatar = true }: { rows?: number; withAvatar?: boolean }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonListRow key={i} withAvatar={withAvatar} />
    ))}
  </div>
);

export const SkeletonCard = ({ lines = 2 }: { lines?: number }) => (
  <div className="card p-5 space-y-3">
    <SkeletonText className="w-2/3 h-5" />
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonText key={i} className={i === lines - 1 ? "w-1/2" : "w-full"} />
    ))}
  </div>
);

export const SkeletonCardGrid = ({ count = 4, cols = "grid-cols-1 lg:grid-cols-2" }: { count?: number; cols?: string }) => (
  <div className={cn("grid gap-3", cols)}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 3 }: { rows?: number; cols?: number }) => (
  <div className="space-y-2">
    <div className="flex gap-3 pb-2 border-b border-gray-100 dark:border-gray-800">
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonText key={i} className="flex-1 h-3" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-3 py-1.5">
        {Array.from({ length: cols }).map((_, c) => (
          <SkeletonText key={c} className="flex-1" />
        ))}
      </div>
    ))}
  </div>
);

// Ilova ilk marta ochilganda (auth tekshirilayotganda) ko'rsatiladigan
// to'liq sahifa skeleti — Header/Sidebar/kontent shaklini taxminan takrorlaydi,
// shu bilan ekranga birdaniga tarkib "sakrab tushmaydi" (layout shift kamayadi).
export const AppShellSkeleton = () => (
  <div className="min-h-screen bg-background dark:bg-background-dark">
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 z-40">
      <div className="flex items-center justify-between h-full px-4 md:px-6 max-w-[1400px] mx-auto">
        <Skeleton className="w-32 h-7" />
        <div className="flex items-center gap-3">
          <SkeletonAvatar className="w-9 h-9" />
          <SkeletonAvatar className="w-8 h-8" />
        </div>
      </div>
    </header>

    <div className="flex pt-16">
      <aside className="hidden md:flex flex-col fixed top-16 left-0 h-[calc(100vh-4rem)] w-[260px] bg-white dark:bg-surface-dark border-r border-gray-100 dark:border-gray-800 p-4 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="w-full h-9 rounded-xl" />
        ))}
      </aside>

      <main className="flex-1 min-w-0 md:ml-[260px] pb-8">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
          <SkeletonHeader />
          <SkeletonStatGrid count={4} />
          <Skeleton className="w-full h-40" />
        </div>
      </main>
    </div>
  </div>
);

export const SkeletonProductGrid = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card p-5 space-y-4">
        <Skeleton className="w-full h-40" />
        <div className="space-y-2">
          <SkeletonText className="w-2/3 h-5" />
          <SkeletonText className="w-full" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <SkeletonText className="w-16 h-6" />
          <SkeletonText className="w-20 h-9 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);
