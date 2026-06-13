export default function StatusPage() {
  const services = [
    { name: "Agent Execution", status: "operational", uptime: "99.9%" },
    { name: "AI Providers", status: "operational", uptime: "99.8%" },
    { name: "API", status: "operational", uptime: "99.9%" },
    { name: "Payments", status: "operational", uptime: "100%" },
    { name: "Authentication", status: "operational", uptime: "99.9%" },
    { name: "Database", status: "operational", uptime: "99.95%" },
  ];

  return (
    <div className="container-main py-16">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <h1 className="text-3xl font-bold text-white">System Status</h1>
        </div>
        <p className="text-zinc-400 mb-10">All systems normal</p>

        <div className="space-y-3">
          {services.map((svc) => (
            <div key={svc.name} className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${
                  svc.status === "operational" ? "bg-emerald-400" :
                  svc.status === "degraded" ? "bg-yellow-400" : "bg-red-400"
                }`} />
                <span className="text-zinc-200 font-medium">{svc.name}</span>
              </div>
              <span className="text-sm text-zinc-500">{svc.uptime} uptime</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}