export default function Shop() {
  return (
    <div className="flex-grow w-full max-w-[1440px] mx-auto pt-4 relative z-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Student Store</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">Redeem your ASMO coins for exclusive physical gear and digital rewards. Mockups are rendered in 3D for preview.</p>
        </div>
        {/* User Coin Balance Widget */}
        <div className="inline-flex items-center gap-3 bg-surface-container-high px-5 py-3 rounded-2xl border border-white/10 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.05),0_10px_20px_-5px_rgba(0,0,0,0.5)]">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4)]">
            <span className="material-symbols-outlined text-on-primary-container text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>monetization_on</span>
          </div>
          <div>
            <p className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">Balance</p>
            <p className="font-headline-md text-[20px] text-primary font-bold leading-none">2,450</p>
          </div>
        </div>
      </div>
      
      {/* Bento Grid for Shop Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 pb-8">
        {/* Item Card 1: Hoodie */}
        <div className="bg-surface-container clay-card rounded-[32px] p-4 flex flex-col gap-5 border border-white/5 group relative">
          <div className="w-full aspect-square rounded-[24px] clay-inset bg-surface-container-lowest/40 flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(157,92,255,0.1)_0%,transparent_60%)]"></div>
            <img className="w-full h-full object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform duration-500 ease-out" src="https://lh3.googleusercontent.com/aida-public/AB6AXuATc9Rf0pbOJ76QO_sBE64_8W6W0byAJi-tbFktSLmqcKLyt8YtyeM8ylFDRywA7sOcWPmlW2PDDQHfvOF69FHqFg3_dGx8T0ZdFSvd1ghVJoijdOYUhWOHuO_D9PpFtnFazowi6NLlsUztFjCnqZwcLrdqqGfn1D7hDc-phn9sMQpmcvvjApprZv6qb2J9c5BVVPcjdZ7WGRDkC-3sNdSm-qHZ-jbqZ9puMCd6lLYH0VtKpheQHlWdqvnxQHhlN6jTcEHWVx2VxB4"/>
            <div className="absolute top-4 left-4 bg-secondary-container/80 backdrop-blur-md px-3 py-1 rounded-full text-on-secondary-container font-label-sm text-[11px] border border-white/10 shadow-lg">
              Limited Edition
            </div>
          </div>
          <div className="flex flex-col gap-2 px-2 flex-grow">
            <div className="flex justify-between items-start gap-4">
              <h3 className="font-body-lg text-body-lg font-bold text-on-surface leading-tight">ASMO Varsity Hoodie</h3>
            </div>
            <p className="font-body-md text-[14px] text-on-surface-variant line-clamp-2">Premium heavyweight cotton with embroidered logo. Soft clay texture.</p>
            <div className="inline-flex items-center gap-1.5 mt-2 mb-4 w-fit px-3 py-1.5 rounded-full bg-surface-container-lowest border border-white/5 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.5)]">
              <span className="material-symbols-outlined text-tertiary text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>toll</span>
              <span className="font-label-sm text-tertiary-fixed text-[14px] font-bold">1,200</span>
            </div>
            <button className="mt-auto w-full py-3.5 rounded-2xl bg-primary text-on-primary font-label-sm text-[14px] flex items-center justify-center gap-2 clay-button transition-all duration-200">
              <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
              BUY NOW
            </button>
          </div>
        </div>
        
        {/* Item Card 2: Backpack */}
        <div className="bg-surface-container clay-card rounded-[32px] p-4 flex flex-col gap-5 border border-white/5 group relative">
          <div className="w-full aspect-square rounded-[24px] clay-inset bg-surface-container-lowest/40 flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,219,233,0.1)_0%,transparent_60%)]"></div>
            <img className="w-full h-full object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform duration-500 ease-out" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuRaM916KIZYGKpkQ6Uobbm-DWCGQZ9f9tBBaTsnmphyIipl2jOmFnYJMGBzgvNZh4S3e6gs8WTeGHW_6YEosEJgGRpFa-tbB-zICMYnG5tKuHFXtjgzRLYixb4lq2BA5TYVygwbGIOmBamh03CD0BQpDvagds-j8lNNswBJUW4mxFuIfRbN-wMVu-isEyxl1N27MVRz1wznZKPrf2lYC3rAD5oOvyW1QIjwe9N0JaMtS3ZkTwRUmnCV2D_BonwWwB40cGLAPA2n4"/>
          </div>
          <div className="flex flex-col gap-2 px-2 flex-grow">
            <div className="flex justify-between items-start gap-4">
              <h3 className="font-body-lg text-body-lg font-bold text-on-surface leading-tight">Tech Commuter Pack</h3>
            </div>
            <p className="font-body-md text-[14px] text-on-surface-variant line-clamp-2">Water-resistant shell with padded laptop sleeve and hidden compartments.</p>
            <div className="inline-flex items-center gap-1.5 mt-2 mb-4 w-fit px-3 py-1.5 rounded-full bg-surface-container-lowest border border-white/5 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.5)]">
              <span className="material-symbols-outlined text-tertiary text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>toll</span>
              <span className="font-label-sm text-tertiary-fixed text-[14px] font-bold">850</span>
            </div>
            <button className="mt-auto w-full py-3.5 rounded-2xl bg-primary text-on-primary font-label-sm text-[14px] flex items-center justify-center gap-2 clay-button transition-all duration-200">
              <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
              BUY NOW
            </button>
          </div>
        </div>
        
        {/* Item Card 3: Water Bottle */}
        <div className="bg-surface-container clay-card rounded-[32px] p-4 flex flex-col gap-5 border border-white/5 group relative">
          <div className="w-full aspect-square rounded-[24px] clay-inset bg-surface-container-lowest/40 flex items-center justify-center p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,175,209,0.1)_0%,transparent_60%)]"></div>
            <img className="w-full h-full object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-500 ease-out" src="https://lh3.googleusercontent.com/aida-public/AB6AXuASuMYvqbLNY-Dubs2LmuUuvOfxcpidqpui0AM7FqhO3BJ-CBw6PVWcN2BdIQExei82w5IUDEd9nCucijlCCP_mRCsBsonl6zqe-nN7Gm_605VZQI4FtGvAkR2phHcI501O2cGb5q8mE2ICmsZPNyjYbDy_iE75_6CaQC2XA-_0vP8ksDzjYeeZvK0YyXRMMILgWRtxXD3i0h0OhgbxVdeXjBHsN0ICujzOUdUDSdkE637O5dBF_ZvtKplWV7mJX8MxUVFtM1GqrGo"/>
          </div>
          <div className="flex flex-col gap-2 px-2 flex-grow">
            <div className="flex justify-between items-start gap-4">
              <h3 className="font-body-lg text-body-lg font-bold text-on-surface leading-tight">Hydro Flask 32oz</h3>
            </div>
            <p className="font-body-md text-[14px] text-on-surface-variant line-clamp-2">Vacuum insulated stainless steel. Keeps drinks cold for 24 hours.</p>
            <div className="inline-flex items-center gap-1.5 mt-2 mb-4 w-fit px-3 py-1.5 rounded-full bg-surface-container-lowest border border-white/5 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.5)]">
              <span className="material-symbols-outlined text-tertiary text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>toll</span>
              <span className="font-label-sm text-tertiary-fixed text-[14px] font-bold">400</span>
            </div>
            <button className="mt-auto w-full py-3.5 rounded-2xl bg-primary text-on-primary font-label-sm text-[14px] flex items-center justify-center gap-2 clay-button transition-all duration-200">
              <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
              BUY NOW
            </button>
          </div>
        </div>
        
        {/* Item Card 4: Cap */}
        <div className="bg-surface-container clay-card rounded-[32px] p-4 flex flex-col gap-5 border border-white/5 group relative">
          <div className="w-full aspect-square rounded-[24px] clay-inset bg-surface-container-lowest/40 flex items-center justify-center p-6 relative overflow-hidden">
            <img className="w-full h-full object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-500 ease-out" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzCTihPBXZcX1KZe4HZRazjbTvm1JZwGPNNxS7cJ8N7ADTphf-t2-3foDkG9rVPFguAP1QIyI1muwR_2B71xLWFuS9aIwH00aVnSrsbn2Z9uJVevOEf1K5b-2fLsxESU-bihz7cKfWqOdqXrIVJ-K_Z87uZWgEk4kIljHdJE7H5HUA3uWpbTkbm7aQNQ0-BZTlHntfOZuEpVA-wA3oqpk3fWHA_3WLa5--piG81U6P2IWx3K-b0XXhEvqYvK0AaDVqtDYxtcgPWyg"/>
          </div>
          <div className="flex flex-col gap-2 px-2 flex-grow">
            <div className="flex justify-between items-start gap-4">
              <h3 className="font-body-lg text-body-lg font-bold text-on-surface leading-tight">Classic Snapback</h3>
            </div>
            <p className="font-body-md text-[14px] text-on-surface-variant line-clamp-2">Adjustable fit with 3D puff embroidery. Six-panel construction.</p>
            <div className="inline-flex items-center gap-1.5 mt-2 mb-4 w-fit px-3 py-1.5 rounded-full bg-surface-container-lowest border border-white/5 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.5)]">
              <span className="material-symbols-outlined text-tertiary text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>toll</span>
              <span className="font-label-sm text-tertiary-fixed text-[14px] font-bold">250</span>
            </div>
            <button className="mt-auto w-full py-3.5 rounded-2xl bg-primary text-on-primary font-label-sm text-[14px] flex items-center justify-center gap-2 clay-button transition-all duration-200">
              <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
              BUY NOW
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
