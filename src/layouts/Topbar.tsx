export default function Topbar() {
  return (
    <header className="hidden md:flex w-full h-20 px-8 sticky top-0 z-40 bg-background/10 backdrop-blur-md justify-between items-center max-w-[1440px] ml-[280px]">
      <div className="font-display-lg text-display-lg tracking-tight text-primary">
        {/* ASMO Learning Center */}
      </div>

      <div className="flex items-center gap-6">
        <div className="clay-inset flex items-center px-4 py-2 w-64">
          <span className="material-symbols-outlined text-on-surface-variant mr-2">
            search
          </span>

          <input
            className="bg-transparent border-none focus:ring-0 text-on-surface w-full placeholder:text-on-surface-variant/50 outline-none"
            placeholder="Search..."
            type="text"
          />
        </div>

        <div className="flex items-center gap-4 text-primary dark:text-primary-fixed-dim">
          <button className="w-10 h-10 flex items-center justify-center hover:bg-primary/10 rounded-full transition-colors active:scale-90">
            <span className="material-symbols-outlined">notifications</span>
          </button>

          <button className="w-10 h-10 flex items-center justify-center hover:bg-primary/10 rounded-full transition-colors active:scale-90">
            <img
              alt="User Profile"
              className="w-8 h-8 rounded-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqfdpMdYuQDMFFzgz6toybJDdZsY8wCE82lFclFvNlDC6OoGmdQDULEsJrDpm0m0LYyaxYeJM0_fzkBvcxUWX3L_CfcTCvCctovzmsj1rqsv94rUqcU0FODt1ebDmTMWOArL526fxBRjEIKktwrjtMepvDvWVEAKJXJIY8URpw0_wMpWLPrfT6Gzx17wrhoKSDZRRpLjOMoby16JuaninEhOmfFN-eJfnStf9QGCkBGgCKYFhZ3z-v1-VyGk3g_UVNCShlk-c-xLw"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
