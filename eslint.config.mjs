import nextConfig from 'eslint-config-next';

const eslintConfig = [
	...nextConfig,
	{
		ignores: [
			'**/src/generated/**/*', // Ignore all generated files, including Prisma
		],
	},
	{
		rules: {
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			// Disable the new React 19 hook rule - existing patterns use setState in effects
			'react-hooks/set-state-in-effect': 'off',
		},
	},
];

export default eslintConfig;
