import type { NextConfig } from "next";

const ALLOWED_FRAME_ANCESTORS = [
  "https://infosfg.com",
  "https://www.infosfg.com",
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Oculta el indicador "N" de Next en dev. En producción no aparece nunca.
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors 'self' ${ALLOWED_FRAME_ANCESTORS.join(" ")};`,
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

export default config;
