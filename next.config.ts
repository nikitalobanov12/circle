import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	reactStrictMode: true,
	images: {
		remotePatterns: [
			{ protocol: 'https', hostname: 'www.google.com' },
			{ protocol: 'https', hostname: 'images.unsplash.com' },
			{ protocol: 'https', hostname: 'a.espncdn.com' },
			{ protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com' },
			{ protocol: 'https', hostname: 'bigboyburgers.bcitwebdeveloper.ca' },
			{ protocol: 'https', hostname: 'randomuser.me' },
			{ protocol: 'https', hostname: 'res.cloudinary.com' },
		],
	},

	// Empty turbopack config to acknowledge Turbopack as default in Next.js 16
	turbopack: {},

	typescript: {
		ignoreBuildErrors: true,
	},
};

export default nextConfig;
