export default function Leaderboard() {
  return (
    <div className="flex-1 flex flex-col relative z-10 w-full pt-4">
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary-container/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Leaderboard Canvas */}
      <div className="max-w-[1440px] mx-auto w-full flex-1 flex flex-col gap-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface drop-shadow-md">
              Global Rankings
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Top performers of the current season.
            </p>
          </div>
          {/* Period Toggle */}
          <div className="flex bg-surface-container-high/80 p-1 rounded-2xl backdrop-blur-md clay-inset border border-white/5">
            <button className="px-6 py-2 rounded-xl font-label-sm text-label-sm text-on-surface bg-surface-container shadow-sm border border-white/10 transition-all">
              This Week
            </button>
            <button className="px-6 py-2 rounded-xl font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-all">
              All Time
            </button>
          </div>
        </div>

        {/* Podium Section */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 mt-12 mb-8 items-end justify-center max-w-4xl mx-auto w-full h-[300px]">
          {/* Rank 2 (Silver) */}
          <div className="flex flex-col items-center group relative h-[85%]">
            <div className="relative z-10 mb-[-20px] transform group-hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full p-1 bg-gradient-to-br from-gray-300 to-gray-500 shadow-[0_10px_20px_rgba(156,163,175,0.2)] z-20 relative">
                <img
                  alt="Rank 2 Avatar"
                  className="w-full h-full rounded-full object-cover border-2 border-surface-container-high"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuChZFT8DmVdJ3vn9I7f6w9D_xhOubd0ttEwxyJhLkGE09iRGqTVcafVJjmO-c7hrcYU_j77_200Q9vKOBJtlJHhWJvRQurLHa_9vr_apS55bfxinU6NIA80j0WCqdwwwRG0a1J-tvW9E3xna9EmrYnREC4swTLdcDiNNs1wWICLsfJgqNekY09z4XEtbLxuO_4z8CyS1kqRVT261HHGIG0j6Sw0pZe-OpPeJ27uQ_NJqAJf6DDy-g9pjJxelINara3lqJ_W7uM65LY"
                />
              </div>
              <div className="absolute -bottom-3 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 clay-medal flex items-center justify-center border-2 border-surface z-30">
                <span className="font-label-sm text-[12px] text-white font-bold drop-shadow-md">
                  2
                </span>
              </div>
            </div>
            <div className="w-full bg-surface-container-high/60 backdrop-blur-xl rounded-t-3xl border-t border-l border-r border-white/10 clay-card flex-1 flex flex-col items-center justify-start pt-10 pb-4 px-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-gray-400/10 to-transparent pointer-events-none"></div>
              <span className="font-label-sm text-label-sm text-on-surface font-bold text-center w-full truncate px-2">
                Elena R.
              </span>
              <div className="mt-auto bg-surface-container-lowest/50 px-3 py-1.5 rounded-full clay-inset flex items-center gap-1 border border-white/5">
                <span className="material-symbols-outlined text-primary text-[14px]">
                  stars
                </span>
                <span className="font-label-sm text-label-sm text-primary">
                  8,450
                </span>
              </div>
            </div>
          </div>

          {/* Rank 1 (Gold) */}
          <div className="flex flex-col items-center group relative h-full">
            <div className="absolute top-0 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl z-0 pointer-events-none"></div>
            <div className="relative z-20 mb-[-25px] transform group-hover:-translate-y-3 transition-transform duration-300">
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-full p-1.5 bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 shadow-[0_0_30px_rgba(250,204,21,0.4)] z-20 relative">
                <img
                  alt="Rank 1 Avatar"
                  className="w-full h-full rounded-full object-cover border-[3px] border-surface-container-lowest"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfd4Kzmy7KWg0ZHKBJzGXqTifEmqd0_IZ8MZZ4d9LQ6NRyx9QXJG8aOHYiHEXUBFs-igTLdBDN2W9eFiLUWCrGeb0cEt_9QWBCXrdgIcNOuulr1zGHOCDETvkTzz5yBQTS3Wh3zVOYBsITM1DYrtEmPFVrTCZ_zEmStej9R1d4sRGJM5cScBt2zIZOO8Agox4qfKYjkYwFvoH_tMi8lmeDVWfkj2Nt-fqHVxarXR5iL8rgEyCci_fIiPOUfmDTOLSQ6k8K1iBeOWo"
                />
                <span
                  className="material-symbols-outlined absolute -top-4 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  crown
                </span>
              </div>
              <div className="absolute -bottom-4 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 clay-medal flex items-center justify-center border-2 border-surface z-30 shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                <span className="font-label-sm text-[14px] text-yellow-900 font-extrabold drop-shadow-sm">
                  1
                </span>
              </div>
            </div>
            <div className="w-full bg-gradient-to-t from-primary-container/20 to-surface-container-high/80 backdrop-blur-2xl rounded-t-3xl border border-white/20 clay-card flex-1 flex flex-col items-center justify-start pt-12 pb-6 px-2 relative overflow-hidden shadow-[0_-10px_40px_rgba(170,115,255,0.2)] z-10">
              <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/5 to-transparent pointer-events-none"></div>
              <span className="font-headline-md text-headline-md text-on-surface text-center w-full truncate px-2 text-lg">
                Marcus T.
              </span>
              <div className="mt-auto bg-surface-container-lowest/80 px-4 py-2 rounded-full clay-inset flex items-center gap-1.5 border border-primary/30 shadow-[0_0_15px_rgba(170,115,255,0.3)]">
                <span
                  className="material-symbols-outlined text-primary-fixed text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  local_fire_department
                </span>
                <span className="font-label-sm text-[15px] text-primary-fixed font-bold tracking-wider">
                  12,890
                </span>
              </div>
            </div>
          </div>

          {/* Rank 3 (Bronze) */}
          <div className="flex flex-col items-center group relative h-[75%]">
            <div className="relative z-10 mb-[-15px] transform group-hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full p-1 bg-gradient-to-br from-orange-300 via-orange-500 to-orange-700 shadow-[0_10px_20px_rgba(249,115,22,0.2)] z-20 relative">
                <img
                  alt="Rank 3 Avatar"
                  className="w-full h-full rounded-full object-cover border-2 border-surface-container-high"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgBdLHb98Z7yuPkdLOeqjh69HF0K1KSSho7X6Mb6e6U14aQWNh4-d5J4Pgf3F2BngP-zRJMHyupbYBfgd0lKv1fntq_Mzbndi3jHNdoETelM57jTV6BfJpNHthqmXxYmOSXQPbtztF2NC8zOpA6rdWqXuOjYNQuKgWMUlnzTilXbOZJsyQDzxjNT18lBsIkJa14amoUmfUfN-NtNIKUz--o8wRrgGxTOiP1uC8hxdYbA0FwRZxjTB_MsuUw1oP-xUalFZewr08Oo8"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-orange-300 via-orange-500 to-orange-700 clay-medal flex items-center justify-center border-2 border-surface z-30">
                <span className="font-label-sm text-[11px] text-orange-100 font-bold drop-shadow-md">
                  3
                </span>
              </div>
            </div>
            <div className="w-full bg-surface-container-high/60 backdrop-blur-xl rounded-t-3xl border-t border-l border-r border-white/10 clay-card flex-1 flex flex-col items-center justify-start pt-8 pb-4 px-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none"></div>
              <span className="font-label-sm text-label-sm text-on-surface font-bold text-center w-full truncate px-2">
                Sarah J.
              </span>
              <div className="mt-auto bg-surface-container-lowest/50 px-3 py-1.5 rounded-full clay-inset flex items-center gap-1 border border-white/5">
                <span className="material-symbols-outlined text-primary text-[14px]">
                  stars
                </span>
                <span className="font-label-sm text-label-sm text-primary">
                  7,920
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-surface-container/40 backdrop-blur-xl rounded-3xl border border-white/5 p-2 md:p-4 clay-card">
          <div className="flex flex-col gap-1">
            <div className="flex items-center px-4 py-3 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider text-[11px] border-b border-white/5 mb-2">
              <div className="w-12 text-center">Rank</div>
              <div className="flex-1 px-4">Student</div>
              <div className="w-24 text-right">Score</div>
            </div>

            <div className="flex items-center px-4 py-3 rounded-2xl hover:bg-surface-container-high/50 transition-colors group">
              <div className="w-12 text-center font-headline-md text-headline-md text-on-surface-variant/70 text-lg group-hover:text-primary transition-colors">
                4
              </div>
              <div className="flex-1 px-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 clay-inset">
                  <img
                    alt="Student Avatar"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwHlNKvwY7NIAwEz71wO9NjaCwdorIx2YQMW_W0NufoBhwX_D_qHlr8-8aMXnZ8jnRzaskEovMQCr15nThgDUH8QrHSbwivci9bQNPgMk7eoBH4ajKVHDuYjAaUalGJEMOV93G9QtkiJl9p5LgLT7pzLlhJFLaAy4q1RtL8mg6WgXBHSVMdbgRZyF-ya1ObtwcjoxptqaOd7uPMisSlCzZODMCN0lflfpe1WQCNKhG1HnYA0xt5s7M2Z8JKSIOKmiJVMypLWIysXg"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-body-md text-body-md text-on-surface">
                    David Chen
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant text-[11px]">
                    Level 42
                  </span>
                </div>
              </div>
              <div className="w-24 flex justify-end">
                <div className="bg-surface-container-lowest/80 px-3 py-1 rounded-full clay-inset flex items-center gap-1 border border-white/5 shadow-inner">
                  <span className="font-label-sm text-label-sm text-primary-fixed-dim">
                    6,540
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center px-4 py-3 rounded-2xl hover:bg-surface-container-high/50 transition-colors group">
              <div className="w-12 text-center font-headline-md text-headline-md text-on-surface-variant/70 text-lg group-hover:text-primary transition-colors">
                5
              </div>
              <div className="flex-1 px-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 clay-inset">
                  <img
                    alt="Student Avatar"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrBgcajKLx2SlAQzCxrr4Ok27P6CnJ7aMDzeLNp7SGbLVJwOd4KRstsS14LxbBTw_4Rtna2isq_ApatMA6AXdx9c34fnpHH1raZEkSXysI20VqswVmAKIloSflCgO30yD_3j-eyq7rgJpeme9O3-sPVMG5gBqlRe83fwf31LqBnWtdiHqciA7KLONr6mMRmF7OEa5_zr-FZQNOSXoMcHmqM1-DPl1TgCVyweCq_CO9PB_15qV-PpeJfwfj_6-4T3j7YtpEnpjPt20"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-body-md text-body-md text-on-surface">
                    Aisha Patel
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant text-[11px]">
                    Level 39
                  </span>
                </div>
              </div>
              <div className="w-24 flex justify-end">
                <div className="bg-surface-container-lowest/80 px-3 py-1 rounded-full clay-inset flex items-center gap-1 border border-white/5 shadow-inner">
                  <span className="font-label-sm text-label-sm text-primary-fixed-dim">
                    6,120
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center px-4 py-3 rounded-2xl hover:bg-surface-container-high/50 transition-colors group">
              <div className="w-12 text-center font-headline-md text-headline-md text-on-surface-variant/70 text-lg group-hover:text-primary transition-colors">
                6
              </div>
              <div className="flex-1 px-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 clay-inset">
                  <img
                    alt="Student Avatar"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDS72SVbXU4fFljBRmfOOxyaEiDGHwOIR5G2kWhCyxOjnjyuda-BjIVVWyPnREDFgd5yMdWgANYs08TCcV1yLKah0eTPJ4Wkx0MCUyBwcZoND60W3ZMKvx2t6e-jEJ_hzrcVo2YmhBDS2RcPRg-oA3UnmIw6krokumc1uITIkEXTqQKqhXBEG7oKiRyX0F16crdEltP9jOLX4v36rFlHOcRZYn9Q78fJ0bb94gzhTmToNhoZfAAtngDqYP0w3eH5-UnLfyj6-Q1YmE"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-body-md text-body-md text-on-surface">
                    Jordan Lee
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant text-[11px]">
                    Level 38
                  </span>
                </div>
              </div>
              <div className="w-24 flex justify-end">
                <div className="bg-surface-container-lowest/80 px-3 py-1 rounded-full clay-inset flex items-center gap-1 border border-white/5 shadow-inner">
                  <span className="font-label-sm text-label-sm text-primary-fixed-dim">
                    5,890
                  </span>
                </div>
              </div>
            </div>

            {/* Current User Row */}
            <div className="flex items-center px-4 py-4 rounded-2xl bg-primary/10 border border-primary/20 mt-2 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>
              <div className="w-12 text-center font-headline-md text-headline-md text-primary text-lg drop-shadow-sm">
                42
              </div>
              <div className="flex-1 px-4 flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary clay-inset relative">
                  <img
                    alt="My Profile"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfODZajm64baJyaiqaDRaNsC1r7FN4q8O3V-KEopQsel99Fbf3GinNvcdZahBEmL7oySqj07CR6VhNFNJ6ZEC7lSQhC56v5MJESVS97LM_-gY6T2_rap1zBOkkTJm5KFPv6JmcOgGG1ML61mE3sPb2L-XcfizmECtsjF-6YRI9kRVV7Ays-24PCN6NX9ZKZcYtkz0OmqLWX8gmZrLy7eqMK0-UaIFJAXEWZK6-ZwNKKmhqjN5mvOajHK-oNvJgKOM80fFS4AsOxGQ"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-body-md text-body-md text-primary-fixed font-bold">
                    You (Alex Mercer)
                  </span>
                  <span className="font-label-sm text-label-sm text-primary/70 text-[11px]">
                    Level 21
                  </span>
                </div>
              </div>
              <div className="w-24 flex justify-end relative z-10">
                <div className="bg-primary-container px-3 py-1 rounded-full clay-inset flex items-center gap-1 border border-primary-fixed/30 shadow-[0_0_10px_rgba(170,115,255,0.4)]">
                  <span className="font-label-sm text-label-sm text-on-primary-container font-bold">
                    2,450
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
