export default function PasswordLoading() {
  return (
    <div className="container-main py-8 max-w-2xl animate-pulse">
      <div className="skeleton h-7 w-44 rounded mb-8" />
      <div className="glass glass-card">
        <div className="px-6 py-4 border-b border-light">
          <div className="skeleton h-5 w-44" />
        </div>
        <div className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-10 w-full rounded-lg" />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <div className="skeleton h-10 w-36 rounded-lg" />
            <div className="skeleton h-10 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
