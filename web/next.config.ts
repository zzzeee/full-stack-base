import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    env: {
        API_BASE_URL: process.env.API_BASE_URL,
        API_PREFIX: process.env.API_PREFIX,
    },
    async redirects() {
        return [
            { source: "/expo/dash/coffee/scan", destination: "/expo/dash/redeem/scan/coffee", permanent: false },
            { source: "/expo/dash/coffee/records", destination: "/expo/dash/redeem/records/coffee", permanent: false },
            { source: "/expo/dash/coffee/gift", destination: "/expo/dash/redeem/coffee/gift", permanent: false },
            { source: "/expo/dash/material/scan", destination: "/expo/dash/redeem/scan/material", permanent: false },
            { source: "/expo/dash/material/records", destination: "/expo/dash/redeem/records/material", permanent: false },
            { source: "/expo/dash/material/stats", destination: "/expo/dash/redeem/material-stats", permanent: false },
            { source: "/expo/dash/bus/departure", destination: "/expo/dash/redeem/scan/bus/departure", permanent: false },
            { source: "/expo/dash/bus/return", destination: "/expo/dash/redeem/scan/bus/return", permanent: false },
            { source: "/expo/dash/bus/list", destination: "/expo/dash/redeem/records/bus", permanent: false },
            { source: "/expo/dash/workorder/list", destination: "/expo/dash/workorder/preview", permanent: false },
        ]
    },
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
