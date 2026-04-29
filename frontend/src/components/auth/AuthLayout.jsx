function AuthLayout({ title, subtitle, children, backgroundImage, hideLeftPanel = false, centerHeader = false, titleClassName = '', titleStyle = undefined, subtitleClassName = '', subtitleStyle = undefined, contentStyle = undefined }) {
  const titleBaseColorClass = titleClassName ? '' : 'text-slate-800';

  return (
    <div
      className={`relative min-h-screen overflow-hidden px-4 pb-10 sm:px-6 lg:px-10 ${hideLeftPanel ? 'pt-32 sm:pt-36' : 'pt-10'}`}
      style={
        backgroundImage
          ? {
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }
          : undefined
      }
    >
      {!backgroundImage ? <div className="absolute -left-24 top-14 h-64 w-64 rounded-full bg-kid-sky/15 blur-3xl" /> : null}
      {!backgroundImage ? <div className="absolute -right-20 bottom-12 h-72 w-72 rounded-full bg-kid-lilac/20 blur-3xl" /> : null}

      <div className={`mx-auto grid w-full gap-6 ${hideLeftPanel ? 'max-w-md lg:max-w-lg' : 'max-w-6xl lg:grid-cols-2 lg:gap-8'}`}>
        {!hideLeftPanel ? (
          <section
            className="relative hidden overflow-hidden rounded-3xl bg-white/80 p-8 shadow-card backdrop-blur md:block lg:p-10"
            style={
              backgroundImage
                ? {
                    backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.35)), url(${backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          >
            {backgroundImage ? <div className="absolute inset-0 bg-slate-900/15" /> : null}
            <div className="relative z-10">
            <span className="inline-flex items-center rounded-full bg-kid-mint/20 px-3 py-1 text-xs font-semibold text-slate-700">
              Dyslexia Support Platform
            </span>

            <h2 className={`mt-6 text-3xl font-extrabold leading-tight lg:text-4xl ${backgroundImage ? 'text-white' : 'text-slate-800'}`}>
              Learn with confidence,
              <br />
              one step at a time.
            </h2>

            <p className={`mt-4 max-w-lg text-base ${backgroundImage ? 'text-slate-100' : 'text-slate-600'}`}>
              A gentle and guided assessment experience designed for children, parents, and educators.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FeaturePill label="Friendly progress tracking" hasBackgroundImage={Boolean(backgroundImage)} />
              <FeaturePill label="Simple step-by-step flow" hasBackgroundImage={Boolean(backgroundImage)} />
              <FeaturePill label="Clear visual feedback" hasBackgroundImage={Boolean(backgroundImage)} />
              <FeaturePill label="Personalized support tips" hasBackgroundImage={Boolean(backgroundImage)} />
            </div>
            </div>
          </section>
        ) : null}

        <section className={`rounded-3xl bg-white/95 p-6 shadow-card backdrop-blur sm:p-8 lg:p-10 ${hideLeftPanel ? 'mt-8' : ''}`}>
          <h1
            className={`text-3xl font-extrabold font-kids ${titleBaseColorClass} ${centerHeader ? 'text-center' : ''} ${titleClassName}`}
            style={titleStyle}
          >
            {title}
          </h1>
          <p
            className={`mt-2 text-sm text-slate-500 sm:text-base ${centerHeader ? 'text-center' : ''} ${subtitleClassName}`}
            style={subtitleStyle}
          >
            {subtitle}
          </p>
          <div className="mt-6" style={contentStyle}>{children}</div>
        </section>
      </div>
    </div>
  );
}

function FeaturePill({ label, hasBackgroundImage }) {
  return (
    <div
      className={`rounded-xl px-4 py-3 text-sm font-medium ${
        hasBackgroundImage
          ? 'border border-white/30 bg-white/15 text-white backdrop-blur'
          : 'border border-slate-100 bg-slate-50/70 text-slate-700'
      }`}
    >
      {label}
    </div>
  );
}

export default AuthLayout;
