export default function Groups() {
  return (
    <div className="max-w-[1440px] mx-auto w-full pt-4 relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h2 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg font-black text-primary mb-2">My Study Groups</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Collaborate and conquer your goals.</p>
        </div>
        <button className="bg-primary text-on-primary rounded-xl px-6 py-3 font-label-sm text-label-sm uppercase tracking-wider clay-button hover:scale-105 active:scale-95 transition-all duration-200 hidden sm:flex items-center gap-2">
          <span className="material-symbols-outlined">add</span>
          Join Group
        </button>
      </div>
      
      {/* Groups Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* Group Card 1 */}
        <div className="clay-card rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary-container rounded-full blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-primary-container/20 text-primary-fixed text-xs font-label-sm uppercase tracking-wider mb-3 clay-card border border-primary/20">Active</span>
              <h3 className="font-headline-md text-headline-md text-on-surface">IELTS Level 1</h3>
              <p className="text-on-surface-variant text-sm mt-1">Foundation English</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center clay-card text-tertiary">
              <span className="material-symbols-outlined text-3xl">school</span>
            </div>
          </div>
          {/* Syllabus Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-on-surface-variant">Syllabus Completion</span>
              <span className="font-bold text-primary">65%</span>
            </div>
            <div className="h-4 w-full bg-surface-container-highest rounded-full overflow-hidden clay-inset relative">
              <div className="h-full bg-gradient-to-r from-primary to-tertiary w-[65%] rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGwyMCAyMEgwem0yMCAwbC0yMCAyMFYweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')] opacity-30"></div>
              </div>
            </div>
          </div>
          {/* Teammates */}
          <div>
            <p className="text-sm text-on-surface-variant mb-3 font-medium">Teammates</p>
            <div className="flex -space-x-3">
              <img alt="Teammate" className="w-10 h-10 rounded-full border-2 border-surface-container clay-card object-cover relative z-[4]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_CChAy2KYpiQfY2R8PFTlg59vNuNFCeRaz9N3lexKLnFpbhSIU8Csq7gqw5ErtRAfkrcFBLJUUYAqS_Zq5y0yqyNGbV1iXUtmZkVNIRJNJJe-FqFLtlGAfqzmznY7dw_tMvfqaYkyfwC3c7jS6gqOWaVNnsI9PFflNCPpvBk3hFtrqtuz3wF1aasFmTlCgxsb-EEZhZ1b5UFvOH4k-kN0YYkrojZxIvEh0ZLvB6HDKYZLPdZFM9Ic_agFUtI7twkABIhh23CYTrQ"/>
              <img alt="Teammate" className="w-10 h-10 rounded-full border-2 border-surface-container clay-card object-cover relative z-[3]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8odOgMR5ZMdnOA15ILqMGz9foZw4JqFGyo_d1NDFW01sA-Wtc8xT_TSP2x0CFNav39kG5CmhHm3vY5xLF5nT_Aonwo-QK4rIr3aJbFszILRW1EvYR-evDqLUf1qFDFckuxxnaqns_eTANkNFyEOqDongDsdqZV7-qAL4FejzAyzrJmBUQjDuSKfJoXoNs8MuoZIcEOKWp41sSaqil8quSOhKHDwCnea9iv55cqtoHE_h5IX7IYhskkeIUUSyPfYqhof4xe78BdMM"/>
              <img alt="Teammate" className="w-10 h-10 rounded-full border-2 border-surface-container clay-card object-cover relative z-[2]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBspCroayCTHJ3YfzNBIYMb4kDGfrTeHIbZGhr5xk0zmUsjrfuieeXVEbVo_EnCgngbxkWhB1Xtzv-zRkXgSkT0oak2pM9pWGMldQCtptXwRohl_vw_oPmW7r75sD37HBBUDRzQDght03GdrlmzF3Iljdh_bePFNtwOszmN32YrsyVyxNeIw6IKRUT1E7Q0BbyLfzjRa8xXifRsomp9tXsra8z4Hn8o3eiYwgnvXYITQdoC5INNj7plrnXSBfar49pVdmaeyz2R_4Q"/>
              <div className="w-10 h-10 rounded-full bg-surface-bright border-2 border-surface-container flex items-center justify-center text-xs font-bold text-on-surface clay-card relative z-[1]">
                +4
              </div>
            </div>
          </div>
        </div>

        {/* Group Card 2 */}
        <div className="clay-card rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300 xl:col-span-2">
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-secondary-container rounded-full blur-[60px] opacity-10 group-hover:opacity-30 transition-opacity"></div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-secondary-container/20 text-secondary-fixed text-xs font-label-sm uppercase tracking-wider mb-3 clay-card border border-secondary/20">Upcoming Session</span>
                  <h3 className="font-headline-md text-headline-md text-on-surface">Speaking Club</h3>
                  <p className="text-on-surface-variant text-sm mt-1">Conversational English Practice</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center clay-card text-secondary">
                  <span className="material-symbols-outlined text-3xl">record_voice_over</span>
                </div>
              </div>
              <div className="mb-6 flex gap-4">
                <div className="bg-surface-container/50 rounded-xl p-3 flex-1 border border-white/5">
                  <p className="text-xs text-on-surface-variant mb-1 uppercase tracking-wider">Next Topic</p>
                  <p className="font-bold text-on-surface">Travel & Culture</p>
                </div>
                <div className="bg-surface-container/50 rounded-xl p-3 flex-1 border border-white/5">
                  <p className="text-xs text-on-surface-variant mb-1 uppercase tracking-wider">Time</p>
                  <p className="font-bold text-secondary-fixed">Tomorrow, 18:00</p>
                </div>
              </div>
            </div>
            <div className="w-full md:w-[200px] flex flex-col justify-between">
              {/* Syllabus Progress */}
              <div className="mb-6 md:mb-0">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-on-surface-variant">Participation</span>
                  <span className="font-bold text-secondary">82%</span>
                </div>
                <div className="h-4 w-full bg-surface-container-highest rounded-full overflow-hidden clay-inset relative">
                  <div className="h-full bg-gradient-to-r from-secondary-container to-secondary w-[82%] rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] relative"></div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-sm text-on-surface-variant font-medium">Top Speakers</p>
                <div className="flex -space-x-3">
                  <img alt="Speaker" className="w-10 h-10 rounded-full border-2 border-surface-container clay-card object-cover relative z-[3]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAduLuWnowbVdJRbeptL8blwc_9EULpjUDyip5fAHbs6EeKa8VetU_Ng84F6GoNXbb0BFFmejeth4W4V20b8PYZVXvP3qN6vpGxMoywJn8YgkAgmxu3oR3EcFbeyJJaUBuQHH7EUoXpNRGQk6uufuLxC50WHHLPSxDHeBcbjX4Yu5Bj3cIdxsLMldlRqAldGcF-8OSRli7RU3f14jGMAN2Hzk8ntx7Z7-y2I179yohQIBfUaaGkUgwHnCfpmhvBvhSgORPmaxJUOdI"/>
                  <img alt="Speaker" className="w-10 h-10 rounded-full border-2 border-surface-container clay-card object-cover relative z-[2]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzuVES6IlMUrbcuLqFpSWMOPbwGdVO0ye1jpD04TIL4qrU25ARfaIQq5V2Sr_vGERYf9gsV8ZkIsQFQKbWLlgx5kjgZ28FlvMJkhbmw8hAJM8ttTn81EYfWzBD9BM4s7lieFkIh6J12SZKBbFbcy279CY4OOOs0k2FD3thXLMpNYuYarzwzsC7C8v7zce6r5dApHfgcPV7NMot9Nk6dzgXJetDEbAd57vGVzTnSkoPkb_F3aRUdjzQ59ejhmfF0sDJkuMSRvDQD-g"/>
                  <div className="w-10 h-10 rounded-full bg-secondary-container border-2 border-surface-container flex items-center justify-center text-on-secondary-container clay-card relative z-[1] cursor-pointer hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-sm">add</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
