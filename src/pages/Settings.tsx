export default function Settings() {
  return (
    <div className="flex-1 w-full max-w-container-max mx-auto lg:px-12 flex flex-col gap-8 relative z-10 pt-4 pb-8">
      {/* Ambient Vibrant Purple Gradient Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[radial-gradient(circle,#5f00c0_0%,transparent_70%)] opacity-40 blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-[radial-gradient(circle,#aa73ff_0%,transparent_70%)] opacity-40 blur-[120px] pointer-events-none -z-10"></div>
      
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface">Account Settings</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Manage your personal profile and application preferences.</p>
      </div>
      
      {/* Bento Grid Layout for Forms */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Profile Customization Form (Spans 2 columns) */}
        <section className="xl:col-span-2 bg-surface-container/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 md:p-10 flex flex-col gap-8 clay-card">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <h2 className="font-headline-md text-headline-md text-primary-fixed">Profile Information</h2>
          </div>
          
          {/* Avatar Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative group cursor-pointer">
              <div className="w-32 h-32 rounded-full overflow-hidden clay-inset flex items-center justify-center p-2 border-2 border-transparent group-hover:border-primary-container transition-colors">
                <div className="w-full h-full rounded-full overflow-hidden">
                  <img alt="Current Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUMaoORl3hq67nMRxpxxB6N6JyAUNro_Sf1EKH9YkDTVVSsoKIwNapbLQHo0M7AZSs3oqHfo6-tvv4jolcpMl9h109KVo4CBn5w0qEBwH9QbushuO-HBXtNAt7KeJfxomrBUHXQvxc-qA6UUsmEtMIfBWrgz1Y7YPedQECB6_lj1-RPNAErWOAsgBDXQusrhFVKmNW6sP2ujlLuCEr9dzXV5D0lJ2I3zrlqmm1R_LefZYD6kbkV3OUgZ2MdpVM4b3std42GpCUl5U"/>
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-10 h-10 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center shadow-lg border-2 border-surface-container-low hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>edit</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-center sm:text-left">
              <h3 className="font-body-md text-body-md font-semibold text-on-surface">Profile Picture</h3>
              <p className="font-body-md text-body-md text-sm text-on-surface-variant">We support PNG, JPG or GIF under 5MB.</p>
              <div className="mt-2 space-x-4">
                <button className="text-primary hover:text-primary-fixed transition-colors font-label-sm text-label-sm uppercase tracking-wider">Upload New</button>
                <button className="text-error hover:text-error-container transition-colors font-label-sm text-label-sm uppercase tracking-wider">Remove</button>
              </div>
            </div>
          </div>
          
          {/* Text Fields */}
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="flex flex-col gap-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant ml-2">Full Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">person</span>
                <input className="clay-inset w-full rounded-2xl py-4 pl-12 pr-4 text-on-surface font-body-md text-body-md bg-transparent border border-white/5 focus:outline-none" type="text" defaultValue="Alex Morgan"/>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant ml-2">Username</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">alternate_email</span>
                <input className="clay-inset w-full rounded-2xl py-4 pl-12 pr-4 text-on-surface font-body-md text-body-md bg-transparent border border-white/5 focus:outline-none" type="text" defaultValue="alexm_asmo"/>
              </div>
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant ml-2">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">mail</span>
                <input className="clay-inset w-full rounded-2xl py-4 pl-12 pr-4 text-on-surface font-body-md text-body-md bg-transparent border border-white/5 focus:outline-none" type="email" defaultValue="alex.morgan@example.com"/>
              </div>
            </div>
            <div className="flex flex-col gap-2 md:col-span-2 mt-4">
              <button className="clay-button rounded-2xl py-4 px-8 font-label-sm text-label-sm bg-primary text-on-primary uppercase tracking-widest self-end md:w-auto w-full" type="button">
                Save Changes
              </button>
            </div>
          </form>
        </section>
        
        {/* Preferences Column */}
        <div className="flex flex-col gap-8">
          {/* App Preferences Card */}
          <section className="bg-surface-container/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 flex flex-col gap-8 clay-card">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="font-headline-md text-headline-md text-tertiary-fixed">Preferences</h2>
            </div>
            {/* Language Dropdown */}
            <div className="flex flex-col gap-3">
              <label className="font-label-sm text-label-sm text-on-surface-variant ml-2">Display Language</label>
              <div className="relative group">
                <select className="appearance-none clay-inset w-full rounded-2xl py-4 pl-6 pr-12 text-on-surface font-body-md text-body-md cursor-pointer bg-transparent border border-white/5 outline-none">
                  <option className="bg-surface-container text-on-surface" value="en">English (US)</option>
                  <option className="bg-surface-container text-on-surface" value="uz">O'zbekcha</option>
                  <option className="bg-surface-container text-on-surface" value="ru">Русский</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none group-hover:text-primary-fixed transition-colors">expand_more</span>
              </div>
            </div>
            {/* Timezone */}
            <div className="flex flex-col gap-3">
              <label className="font-label-sm text-label-sm text-on-surface-variant ml-2">Timezone</label>
              <div className="relative group">
                <select className="appearance-none clay-inset w-full rounded-2xl py-4 pl-6 pr-12 text-on-surface font-body-md text-body-md cursor-pointer bg-transparent border border-white/5 outline-none">
                  <option className="bg-surface-container text-on-surface" value="tashkent">(GMT+5) Tashkent</option>
                  <option className="bg-surface-container text-on-surface" value="utc">UTC</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none group-hover:text-primary-fixed transition-colors">expand_more</span>
              </div>
            </div>
          </section>
          
          {/* Notifications Card */}
          <section className="bg-surface-container/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 flex flex-col gap-6 clay-card">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="font-headline-md text-headline-md text-secondary-fixed-dim">Notifications</h2>
            </div>
            {/* Prominent Tactile 3D Claymorphism Toggle */}
            <div className="flex items-center justify-between bg-surface-container-lowest/50 rounded-2xl p-4 border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
              <div className="flex flex-col">
                <span className="font-body-md text-body-md font-semibold text-on-surface">Instant Notifications</span>
                <span className="text-sm text-on-surface-variant mt-1">Receive alerts for important updates immediately.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                <input className="sr-only peer" type="checkbox" defaultChecked />
                <div className="w-16 h-8 bg-surface-container-high rounded-full shadow-[inset_2px_2px_6px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.05)] transition-colors duration-300 relative flex items-center px-1 border border-black/20 peer-checked:bg-primary">
                  <div className="w-6 h-6 bg-surface-variant rounded-full shadow-[inset_2px_2px_4px_rgba(255,255,255,0.2),inset_-2px_-2px_4px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.5)] transition-transform duration-300 peer-checked:translate-x-8 peer-checked:bg-on-primary"></div>
                </div>
              </label>
            </div>
            <div className="flex items-center justify-between bg-surface-container-lowest/50 rounded-2xl p-4 border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] opacity-70 hover:opacity-100 transition-opacity">
              <div className="flex flex-col">
                <span className="font-body-md text-body-md font-semibold text-on-surface">Email Digest</span>
                <span className="text-sm text-on-surface-variant mt-1">Weekly summary of activity.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                <input className="sr-only peer" type="checkbox" />
                <div className="w-16 h-8 bg-surface-container-high rounded-full shadow-[inset_2px_2px_6px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.05)] transition-colors duration-300 relative flex items-center px-1 border border-black/20 peer-checked:bg-primary">
                  <div className="w-6 h-6 bg-surface-variant rounded-full shadow-[inset_2px_2px_4px_rgba(255,255,255,0.2),inset_-2px_-2px_4px_rgba(0,0,0,0.4),0_2px_4px_rgba(0,0,0,0.5)] transition-transform duration-300 peer-checked:translate-x-8 peer-checked:bg-on-primary"></div>
                </div>
              </label>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
