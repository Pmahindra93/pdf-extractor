/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
// require("./src/env.js");

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode to reduce HMR conflicts
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push('pdf-parse')
    }
    return config
  }
};

module.exports = nextConfig;
