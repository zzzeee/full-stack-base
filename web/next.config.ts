import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: `${process.env.API_PREFIX || '/api'}/:path*`,
                destination: `${process.env.API_BASE_URL}${process.env.API_PREFIX || '/api'}/:path*`,
            },
        ];
    },
};

export default nextConfig;
