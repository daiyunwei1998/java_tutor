/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // On Vercel, vercel.json routes /api/* to the FastAPI Python function (api/index.py).
    if (process.env.VERCEL) return [];
    // Locally, proxy /api/* to uvicorn so the browser only talks to Next.js.
    const backend = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;
