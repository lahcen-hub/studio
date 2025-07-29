import type {NextConfig} from 'next';
import {withSerwist} from '@serwist/next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withSerwist({
  ...nextConfig,
  serwist: {
    swSrc: 'src/app/sw.ts',
    swDest: 'public/sw.js',
  },
});
