import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  redirects: async () => [
    { source: "/projects", destination: "/", permanent: true },
  ],
};

export default nextConfig;
