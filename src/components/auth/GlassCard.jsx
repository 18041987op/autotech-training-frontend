export function GlassCard({ children, className = '' }) {
  return (
    <div className={`
      bg-white/85 backdrop-blur-lg
      border border-white/30
      rounded-3xl shadow-xl
      p-8 md:p-10
      ${className}
    `}>
      {children}
    </div>
  );
}
