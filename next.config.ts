import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.21", "*.trycloudflare.com"],
};

export default nextConfig;
