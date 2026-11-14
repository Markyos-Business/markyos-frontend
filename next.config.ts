import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optional isolated output for gallery checks alongside a running app.
  distDir: process.env.NEXT_BUILD_DIR ?? ".next",
  // The front door is always login; it sends anyone already signed in on to their home.
  async redirects() {
    return [
      { source: "/", destination: "/login", permanent: false },
      // The website's sign-up buttons all point at /start (with ?type=, ?plan=
      // and ?lang=); the query string carries through to the sign-up form.
      { source: "/start", destination: "/signup", permanent: false },
    ];
  },
};

export default nextConfig;
