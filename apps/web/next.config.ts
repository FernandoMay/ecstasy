import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The shared package ships compiled ESM from the workspace.
  transpilePackages: ["@ecstasy/stellar"],
};

export default nextConfig;
