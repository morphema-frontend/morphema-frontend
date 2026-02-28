/** @type {import('next').NextConfig} */
const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || '';
const appVersion = process.env.npm_package_version || '';

const nextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
    NEXT_PUBLIC_COMMIT_SHA: commitSha,
  },
};

export default nextConfig;
