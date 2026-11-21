import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optional isolated output for gallery checks alongside a running app.
  distDir: process.env.NEXT_BUILD_DIR ?? ".next",
  async headers() {
    return ["/reset", "/confirm-email"].map(source => ({source, headers:[{key:"Referrer-Policy",value:"no-referrer"},{key:"X-Robots-Tag",value:"noindex, nofollow"}]}));
  },
  // The front door is always login; it sends anyone already signed in on to their home.
  async redirects() {
    return [
      { source: "/", destination: "/login", permanent: false },
      // The website's sign-up buttons all point at /start (with ?type=, ?plan=
      // and ?lang=); the query string carries through to the sign-up form.
      { source: "/start", destination: "/signup", permanent: false },
      // The CMS moved into the admin area; old links still land.
      { source: "/content", destination: "/admin/cms", permanent: false },
      { source: "/content/:path*", destination: "/admin/cms/:path*", permanent: false },
      // The brand sidebar's stages (Nov 2026): the type sandbox became a Visual
      // identity tab and Analysis a Discovery tab; their old pages still land.
      { source: "/w/:slug/type-lab", destination: "/w/:slug/visual-identity?tab=type-lab", permanent: false },
      { source: "/w/:slug/analysis", destination: "/w/:slug/discovery?tab=analysis", permanent: false },
    ];
  },
};

export default nextConfig;
