export default function Payments() {
  return (
    <div className="relative flex flex-col gap-8 w-full max-w-3xl mx-auto min-h-[calc(100vh-10rem)] pb-8">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
      
      <header className="md:hidden mb-4">
        <h1 className="font-display-lg-mobile text-display-lg-mobile text-primary">Payments</h1>
      </header>
      
      {/* 3D Credit Card Component */}
      <div className="w-full aspect-[1.586/1] bg-gradient-to-br from-primary-container to-secondary-container rounded-3xl p-8 clay-card relative overflow-hidden flex flex-col justify-between z-10 group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
        <div className="flex justify-between items-start z-10">
          <span className="material-symbols-outlined text-4xl text-white/80">contactless</span>
          <div className="flex gap-2">
            <div className="w-4 h-4 rounded-full bg-white/40 blur-[1px]"></div>
            <div className="w-4 h-4 rounded-full bg-white/40 blur-[1px]"></div>
          </div>
        </div>
        <div className="z-10 mt-auto">
          <p className="font-label-sm text-label-sm text-white/70 mb-1 tracking-widest uppercase">Current Balance</p>
          <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-white font-black tracking-tight drop-shadow-lg">
            400,000 <span className="text-2xl text-white/80">UZS</span>
          </h2>
        </div>
      </div>
      
      {/* Pay Now Action */}
      <button className="w-full bg-primary text-on-primary font-headline-md text-headline-md py-5 rounded-2xl clay-button flex items-center justify-center gap-3 transition-all">
        <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>account_balance_wallet</span>
        PAY NOW
      </button>
      
      {/* Payment History */}
      <div className="bg-surface-container/50 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-white/5 shadow-xl">
        <h3 className="font-headline-md text-headline-md text-on-surface mb-6">Recent Transactions</h3>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 bg-surface-container-high/50 rounded-2xl hover:bg-surface-container-highest transition-colors border border-transparent hover:border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center clay-card">
                <span className="material-symbols-outlined text-primary">school</span>
              </div>
              <div>
                <p className="font-body-md text-body-md text-on-surface font-semibold">May Tuition</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Paid via Payme
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-body-md text-body-md text-on-surface font-semibold">-250,000 UZS</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">May 12, 2024</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-surface-container-high/50 rounded-2xl hover:bg-surface-container-highest transition-colors border border-transparent hover:border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center clay-card">
                <span className="material-symbols-outlined text-secondary">assignment</span>
              </div>
              <div>
                <p className="font-body-md text-body-md text-on-surface font-semibold">Exam Fee</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Paid via Click
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-body-md text-body-md text-on-surface font-semibold">-50,000 UZS</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">May 05, 2024</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-surface-container-high/50 rounded-2xl hover:bg-surface-container-highest transition-colors border border-transparent hover:border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-tertiary/20 flex items-center justify-center clay-card">
                <span className="material-symbols-outlined text-tertiary">book</span>
              </div>
              <div>
                <p className="font-body-md text-body-md text-on-surface font-semibold">Study Materials</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Paid via Card
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-body-md text-body-md text-on-surface font-semibold">-100,000 UZS</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Apr 28, 2024</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
