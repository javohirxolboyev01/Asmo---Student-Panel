// src/components/common/Skeleton.tsx
// Har bir sahifaning skeleton (yuklanish) ko'rinishini qurish uchun qayta
// ishlatiladigan bo'laklar. Barchasi shu faylga to'plangan — sahifalar
// o'zining haqiqiy tarkibiga mos ravishda shulardan tuzadi.
import { cn } from "@/lib/utils";

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-xl bg-u-sf2", className)} />
);

export const SkeletonAvatar = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-full bg-u-sf2", className)} />
);

export const SkeletonText = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-md bg-u-sf2 h-3.5", className)} />
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
  <div className="flex items-center gap-3 p-4 bg-u-sf shadow-u rounded-[20px]">
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
    <div className="flex gap-3 pb-2 border-b border-u-ln">
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
  <div className="min-h-screen bg-u-bg min-[960px]:pl-[272px]">
    <aside className="hidden min-[960px]:flex flex-col fixed inset-y-0 left-0 w-[272px] bg-u-sf px-4 py-[22px] space-y-2">
      <Skeleton className="w-28 h-7 mb-4" />
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="w-full h-9 rounded-2xl" />
      ))}
    </aside>

    <main className="max-w-[1160px] mx-auto px-4 sm:px-7 py-3 md:py-6 space-y-4 md:space-y-6">
      <div className="flex items-center gap-2">
        <SkeletonAvatar className="w-11 h-11 md:w-12 md:h-12" />
        <div className="flex-1 space-y-1.5">
          <SkeletonText className="w-32 h-4" />
          <SkeletonText className="w-20 h-3" />
        </div>
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
      <SkeletonHeader />
      <SkeletonStatGrid count={4} />
      <Skeleton className="w-full h-40" />
    </main>
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
        <div className="flex items-center justify-between pt-3 border-t border-u-ln">
          <SkeletonText className="w-16 h-6" />
          <SkeletonText className="w-20 h-9 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);
