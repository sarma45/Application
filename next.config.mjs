/** @type {import('next').NextConfig} */

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com https://openrouter.ai https://api.anthropic.com",
  "frame-src 'self' https://challenges.cloudflare.com",
  "font-src 'self' data:",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig = {
  images: { unoptimized: false },
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  webpack(config) {
    config.plugins.push({
      apply(compiler) {
        compiler.hooks.done.tap("AIVerseWebpackDiagnosticsPlugin", (stats) => {
          if (!stats.hasErrors()) return;

          const info = stats.toJson({
            all: false,
            errors: true,
            errorDetails: true,
            moduleTrace: true,
          });

          for (const error of info.errors ?? []) {
            console.error("[webpack:error]", error.message);
            if (error.moduleName) console.error("[webpack:module]", error.moduleName);
            if (error.details) console.error("[webpack:details]", error.details);
            if (error.stack) console.error("[webpack:stack]", error.stack);
          }
        });
      },
    });

    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Content-Security-Policy", value: csp },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "X-RateLimit-Limit", value: "100" },
        ],
      },
    ];
  },
};

export default nextConfig;
