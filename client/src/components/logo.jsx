function Logo() {
  return (
    <>
      <img src="/logo.png" alt="Logo" className="size-9.5" />
      <span
        className="text-4xl font-semibold tracking-[-0.06em]"
        style={{ fontFamily: "system-ui" }}
      >
        <span className="text-white">Flow</span>
        <span className="text-[#ff6b1a] ml-[4px]" style={{ fontWeight: 600 }}>
          IX
        </span>
      </span>
    </>
  );
}

export default Logo;
