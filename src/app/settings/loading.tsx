export default function SettingsLoading() {
  return (
    <div className="container-main py-8 max-w-2xl animate-pulse">
      <div className="skeleton h-7 w-32 rounded mb-8" />
      <div className="glass glass-card mb-6">
        <div className="px-6 py-4 border-b border-light">
          <div className="skeleton h-5 w-16" />
        </div>
        <div className="p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton h-3 w-16 mb-1" />
              <div className="skeleton h-5 w-48" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
