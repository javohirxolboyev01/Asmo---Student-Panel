export default function Home() {
  return (
    <>
      <div className="clay-card relative overflow-hidden rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 z-10">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/20 rounded-full blur-[60px] pointer-events-none"></div>
        <div className="relative z-10 max-w-xl">
          <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-4">Welcome back, Learner!</h1>
          <p className="font-body-lg text-body-lg text-primary-fixed-dim mb-8">Ready for your IELTS Prep?</p>
          <button className="clay-button px-8 py-4 text-on-primary font-label-sm text-label-sm uppercase tracking-wider inline-flex items-center gap-2">
            Start Learning
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
        <div className="relative w-48 h-48 md:w-64 md:h-64 flex-shrink-0 animate-float z-10">
          <img alt="3D Graduation Cap" className="w-full h-full object-contain filter drop-shadow-[0_20px_30px_rgba(157,92,255,0.4)]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzCgpGuYbBicWQyAqpG_D3LCIIY1s-R7qkjhGdBkTrfT9quGZYgVRJRXS8PiigHYv9hIlg55cYilHW9IJeDBqZOhtmlLmodLbbA21HFfSREqNjHOQVJiJNAAUX4DmUrE--VCL0VSIV6yWk3tR_iSkk75zM5SR703-BkFTJ9ifZuYoF36ov-cpEuwEnzCNUE-6upoz5U0X9QUbr6xBpueG9sW9Gqmi0q5Fo900XtOGFZW4NUuMHtUkkbHc6dTVwsE059kBCE_D-PP0"/>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        <div className="clay-card p-6 md:col-span-8 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              Today's Schedule
            </h2>
            <span className="font-label-sm text-label-sm text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">3 Classes</span>
          </div>
          <div className="flex flex-col gap-4">
            <div className="clay-inset p-4 relative overflow-hidden group hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.05),0_0_15px_rgba(157,92,255,0.2)] transition-all duration-300">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
              <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4 ml-2">
                <div>
                  <div className="text-primary font-label-sm text-label-sm mb-1 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    Up Next • 14:00 - 15:30
                  </div>
                  <h3 className="font-body-lg text-body-lg text-on-surface font-bold">IELTS Masterclass</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2 mt-1">
                    <span className="material-symbols-outlined text-[16px]">location_on</span> Room 4
                    <span className="text-white/20 mx-1">|</span>
                    <span className="material-symbols-outlined text-[16px]">person</span> Mr. Alex
                  </p>
                </div>
                <button className="clay-button px-6 py-2 text-on-primary font-label-sm text-label-sm rounded-full self-start md:self-auto">
                  Join Room
                </button>
              </div>
            </div>
            
            <div className="clay-inset p-4 opacity-70 hover:opacity-100 transition-opacity">
              <div className="flex justify-between items-center ml-2">
                <div>
                  <div className="text-on-surface-variant font-label-sm text-label-sm mb-1 uppercase tracking-wider">16:00 - 17:00</div>
                  <h3 className="font-body-md text-body-md text-on-surface font-bold">Speaking Practice</h3>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Online • Ms. Sarah</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="clay-card p-6 md:col-span-4 flex flex-col gap-6">
          <h2 className="font-headline-md text-headline-md text-on-surface border-b border-white/10 pb-4">Prep Progress</h2>
          <div className="flex flex-col gap-4 items-center justify-center flex-grow">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="none" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="8"></circle>
                <circle className="drop-shadow-[0_0_10px_rgba(170,115,255,0.5)]" cx="50" cy="50" fill="none" r="40" stroke="#aa73ff" strokeDasharray="251" strokeDashoffset="60" strokeLinecap="round" strokeWidth="8"></circle>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-display-lg-mobile text-display-lg-mobile text-primary">76%</span>
              </div>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant text-center mt-2">Target Score: 7.5</p>
          </div>
        </div>
        
        <div className="clay-card p-0 md:col-span-12 h-64 relative overflow-hidden group cursor-pointer mt-4">
          <div className="absolute inset-0 bg-cover bg-center w-full h-full opacity-50 group-hover:opacity-70 transition-opacity duration-500 mix-blend-overlay" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB5InCyvrnPnYdiOpv5v88HQryxcYk8a1tuoExldzOV_hXP6DrP_SGEoWJpfq2jNf_PbheVAjdzCsweIMYw-uErfpBpY1A6-Ds9Dd5UUzVBpQO0XS9okbYjv8PN__L9ub6Y2hs-y_f2js1ZtvvTeFMGTnth0zY9PeRpXaoJo-juoCIxxrFic0FsvNhpUBXhE9CWWl463Ua8_7O7202YlrMn6JRuY_nrVpKc5s5a7X1L_aoyPgyVSp33XumYBoFqlS29s9DRViKy0cM')"}}></div>
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent p-8 flex flex-col justify-center">
            <h3 className="font-display-lg-mobile text-display-lg-mobile text-on-surface mb-2">New Mock Tests Available</h3>
            <p className="font-body-lg text-body-lg text-primary-fixed-dim max-w-md mb-6">Test your skills with our latest 2024 IELTS listening and reading materials.</p>
            <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider flex items-center gap-2 group-hover:translate-x-2 transition-transform">Explore Materials <span className="material-symbols-outlined">arrow_forward</span></span>
          </div>
        </div>
      </div>
    </>
  );
}
