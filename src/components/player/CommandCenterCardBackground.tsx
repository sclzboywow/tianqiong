const COMMAND_CENTER_BG = "/images/player/command-center-bg.webp";

export function CommandCenterCardBackground() {
  return (
    <>
      <div
        className="absolute inset-0 bg-cover bg-right bg-no-repeat brightness-[1.06] contrast-[1.04] saturate-[1.08]"
        style={{ backgroundImage: `url('${COMMAND_CENTER_BG}')` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(46,168,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(46,168,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
          maskImage: "linear-gradient(to right, transparent 30%, black 55%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 30%, black 55%)",
        }}
        aria-hidden
      />
      {/* 左侧压暗保可读，右侧尽量露出背景图 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, #050B14 0%, #050B14 28%, rgba(5,11,20,0.82) 42%, rgba(5,11,20,0.35) 62%, rgba(5,11,20,0.12) 100%)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#050B14]/55 via-transparent to-transparent"
        aria-hidden
      />
    </>
  );
}
