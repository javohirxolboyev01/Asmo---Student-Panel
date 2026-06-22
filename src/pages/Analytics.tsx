export default function Analytics() {
  return (
    <div className="flex-1 max-w-container-max mx-auto w-full relative">
      {/* Header Section */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-4">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Performance Analytics</h2>
          <p className="text-on-surface-variant max-w-2xl">Track your IELTS mock exam progression and attendance metrics. Keep up the momentum!</p>
        </div>
        <div className="flex gap-4">
          <div className="clay-card px-6 py-3 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_10px_rgba(255,175,209,0.8)]"></div>
            <span className="font-bold text-on-surface">Target Band: 7.5</span>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)] pb-8">
        {/* Overall Score Card */}
        <div className="clay-card md:col-span-4 p-8 flex flex-col justify-between relative overflow-hidden min-h-[250px]">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
          <div>
            <h3 className="font-bold text-on-surface-variant mb-1">Current Overall Band</h3>
            <div className="font-display-lg text-display-lg text-primary mb-2">6.5</div>
            <div className="inline-flex items-center gap-1 text-tertiary font-bold bg-tertiary/10 px-2 py-1 rounded-lg">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span>+0.5 from last mock</span>
            </div>
          </div>
          <div className="mt-8 flex justify-between items-end z-10">
            <p className="text-sm text-on-surface-variant">Next Exam: <span className="text-on-surface font-semibold">14 Days</span></p>
            <button className="clay-button px-4 py-2 rounded-xl text-sm font-bold text-on-primary">Details</button>
          </div>
        </div>

        {/* Sub-scores Grid */}
        <div className="md:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="clay-inset p-6 flex flex-col justify-center items-center text-center relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-tertiary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="material-symbols-outlined text-4xl text-tertiary mb-3 group-hover:scale-110 transition-transform">headphones</span>
            <h4 className="text-sm text-on-surface-variant font-semibold mb-1">Listening</h4>
            <span className="text-3xl font-bold text-on-surface">7.0</span>
          </div>
          <div className="clay-inset p-6 flex flex-col justify-center items-center text-center relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="material-symbols-outlined text-4xl text-primary mb-3 group-hover:scale-110 transition-transform">menu_book</span>
            <h4 className="text-sm text-on-surface-variant font-semibold mb-1">Reading</h4>
            <span className="text-3xl font-bold text-on-surface">6.5</span>
          </div>
          <div className="clay-inset p-6 flex flex-col justify-center items-center text-center relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="material-symbols-outlined text-4xl text-secondary mb-3 group-hover:scale-110 transition-transform">edit_document</span>
            <h4 className="text-sm text-on-surface-variant font-semibold mb-1">Writing</h4>
            <span className="text-3xl font-bold text-on-surface">6.0</span>
          </div>
          <div className="clay-inset p-6 flex flex-col justify-center items-center text-center relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-inverse-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="material-symbols-outlined text-4xl text-inverse-primary mb-3 group-hover:scale-110 transition-transform">record_voice_over</span>
            <h4 className="text-sm text-on-surface-variant font-semibold mb-1">Speaking</h4>
            <span className="text-3xl font-bold text-on-surface">6.5</span>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="clay-card md:col-span-8 p-6 md:p-8 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-on-surface text-lg">Mock Exam Progression</h3>
            <div className="clay-inset px-3 py-1 flex gap-2">
              <button className="px-3 py-1 rounded-lg bg-surface text-on-surface shadow-sm text-sm font-semibold">1M</button>
              <button className="px-3 py-1 rounded-lg text-on-surface-variant hover:text-on-surface text-sm font-semibold transition-colors">3M</button>
              <button className="px-3 py-1 rounded-lg text-on-surface-variant hover:text-on-surface text-sm font-semibold transition-colors">6M</button>
            </div>
          </div>
          <div className="flex-1 clay-inset relative overflow-hidden rounded-xl border border-white/5 flex items-center justify-center bg-gradient-to-br from-black/40 to-black/10">
            <img alt="Trend Chart Visualization" className="w-full h-full object-cover opacity-80 mix-blend-screen" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0v6eZgQKSw-9OYsb4uUHaRE5q0SkrEOmJ9pV_0Q7QigNyAc9XMH8FUWysJg6L2AGMwuLzyLwhszETXZLrSSfLitij2I4XFZztBZ01yIDhQTG7Egulf7ur7VCWByJIcjEL-DvhtHHKI65wEgP-X1Bm-0N8jRV9M1GOBN6zuwXqpIGvTioa-93_dOtldv2rVdYHe1kCYHhCZoLuQoVjrPYIIO2BDpV3e5O7ZGHVlJL_nWIvT75jhxLf-RD6S8TmCGLV4klDYCedYaw"/>
            <div className="absolute inset-0 pointer-events-none" style={{backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "100% 25%, 25% 100%"}}></div>
          </div>
        </div>

        {/* Attendance Pie Chart */}
        <div className="clay-card md:col-span-4 p-6 md:p-8 flex flex-col items-center text-center justify-center relative min-h-[400px]">
          <h3 className="font-bold text-on-surface text-lg absolute top-8 left-8">Attendance</h3>
          <div className="w-48 h-48 rounded-full relative mt-8 mb-6 clay-inset p-4">
            <div className="w-full h-full rounded-full border-[16px] border-primary/20 relative shadow-[inset_0_10px_20px_rgba(0,0,0,0.5)] flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[16px] border-primary" style={{clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 80%)"}}></div>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-black text-on-surface">92%</span>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Present</span>
              </div>
            </div>
          </div>
          <div className="w-full space-y-3 mt-auto">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_theme('colors.primary')]"></div>
                <span className="text-on-surface-variant">Present</span>
              </div>
              <span className="font-bold text-on-surface">46 Classes</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-surface-bright shadow-[inset_1px_1px_3px_rgba(0,0,0,0.5)]"></div>
                <span className="text-on-surface-variant">Absent</span>
              </div>
              <span className="font-bold text-on-surface">4 Classes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
