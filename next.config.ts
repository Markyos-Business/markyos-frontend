import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The front door is always login; it sends anyone already signed in on to their home.
  async redirects() {
    return [{ source: "/", destination: "/login", permanent: false }];
  },
};

export default nextConfig;
