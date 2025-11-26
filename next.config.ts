import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint warnings during build will not fail the build
  eslint: {
    ignoreDuringBuilds: false,
  },
  // TypeScript errors during build will not be ignored
  typescript: {
    ignoreBuildErrors: false,
  },
  // Optimize for production
  reactStrictMode: true,
  // Transpile Three.js related packages for better compatibility
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
};

export default nextConfig;
