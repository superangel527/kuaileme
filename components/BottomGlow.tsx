export default function BottomGlow() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 h-[55vh] -z-10"
        style={{
          background:
            "radial-gradient(60% 70% at 50% 100%, rgba(255,95,162,0.18), rgba(139,92,246,0.08) 40%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -top-32 left-1/2 -translate-x-1/2 w-[120vw] h-[40vh] -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(34,211,238,0.10), transparent 70%)",
        }}
      />
    </>
  );
}
