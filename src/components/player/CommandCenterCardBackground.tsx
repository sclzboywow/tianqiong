const COMMAND_CENTER_BG = "/images/player/command-center-bg.webp";

export function CommandCenterCardBackground() {
  return (
    <>
      <div
        className="absolute inset-0 bg-cover bg-right bg-no-repeat"
        style={{ backgroundImage: `url('${COMMAND_CENTER_BG}')` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(46,168,255,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(46,168,255,0.07) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[70%] w-[42%] opacity-[0.14]"
        style={{
          backgroundImage: `
            linear-gradient(to top, rgba(46,168,255,0.5), transparent 60%),
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 18px,
              rgba(46,168,255,0.35) 18px,
              rgba(46,168,255,0.35) 20px
            )
          `,
          clipPath: "polygon(30% 100%, 100% 100%, 100% 0%, 55% 0%, 45% 35%, 30% 35%)",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#050B14]/72" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050B14] via-[#050B14]/95 to-[#050B14]/55" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] via-[#050B14]/50 to-transparent" aria-hidden />
    </>
  );
}
