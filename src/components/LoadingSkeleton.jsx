export function LoadingSkeleton({ count = 1, height = "h-20" }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`skeleton rounded-xl ${height}`} />
      ))}
    </div>
  );
}
