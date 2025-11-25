import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import prisma from './lib/prisma';

export const { handlers, signIn, signOut, auth } = (NextAuth as any)({
	secret: process.env.AUTH_SECRET,
	providers: [
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		}),
		CredentialsProvider({
			credentials: {
				email: {},
				password: {},
			},
			async authorize(credentials: any) {
				try {
					if (!credentials) {
						throw new Error('No credentials provided.');
					}

					// Convert email to lowercase for case-insensitive comparison
					const lowercaseEmail = credentials.email.toLowerCase();

					const user = await prisma.user.findUnique({
						where: {
							email: lowercaseEmail,
						},
						include: {
							_count: {
								select: {
									createdCircles: true,
									Album: true,
									followers: true,
									following: true,
								},
							},
						},
					});

					if (user && user.password === credentials.password) {
						return {
							name: user.name,
							email: user.email,
							id: String(user.id),
							image: user.profileImage,
							username: user.username,
							circleCount: user._count.createdCircles || 0,
							albumCount: user._count.Album || 0,
							followersCount: user._count.followers || 0,
							followingCount: user._count.following || 0,
						};
					}
					return null;
				} catch (err) {
					console.error('Authorization error:', err);
					return null;
				}
			},
		} as any),
	],
	pages: {
		signIn: '/auth/login',
		error: '/auth/session-error',
	},
	session: {
		strategy: 'jwt',
	},
	callbacks: {
		async signIn({ user, account, profile }: any) {
			// Handle Google OAuth sign-in
			if (account?.provider === 'google') {
				try {
					const email = user.email?.toLowerCase();
					if (!email) return false;

					// Check if user exists
					let existingUser = await prisma.user.findUnique({
						where: { email },
					});

					if (!existingUser) {
						// Create new user for Google sign-in
						// Generate a unique username from email
						const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
						let username = baseUsername;
						let counter = 1;

						// Ensure username is unique
						while (await prisma.user.findUnique({ where: { username } })) {
							username = `${baseUsername}${counter}`;
							counter++;
						}

						existingUser = await prisma.user.create({
							data: {
								email,
								username,
								name: user.name || username,
								profileImage: user.image || null,
								password: '', // OAuth users don't have passwords
							},
						});
					}

					// Store the database user ID for the JWT callback
					user.id = String(existingUser.id);
					user.username = existingUser.username;
					user.image = existingUser.profileImage || user.image;

					return true;
				} catch (error) {
					console.error('Error during Google sign-in:', error);
					return false;
				}
			}
			return true;
		},
		async session({ session, token }: any) {
			try {
				if (token && session && session.user) {
					session.user.id = token.id;
					session.user.username = token.username;
					session.user.image = token.image;
					session.user.circleCount = token.circleCount;
					session.user.albumCount = token.albumCount;
					session.user.followersCount = token.followersCount;
					session.user.followingCount = token.followingCount;
				}
				return session;
			} catch (error) {
				console.error('Error in session callback:', error);
				return {
					expires: session?.expires || new Date(Date.now() + 2 * 86400).toISOString(),
					user: session?.user || { name: 'Unknown', email: 'unknown@example.com' },
				};
			}
		},
		async jwt({ token, user, account }: any) {
			try {
				if (user) {
					token.id = user.id;
					token.username = user.username;
					token.image = user.image;
					token.circleCount = user.circleCount || 0;
					token.albumCount = user.albumCount || 0;
					token.followersCount = user.followersCount || 0;
					token.followingCount = user.followingCount || 0;
				}

				// For OAuth providers, fetch user data from DB if not present
				if (account?.provider === 'google' && token.email && !token.username) {
					const dbUser = await prisma.user.findUnique({
						where: { email: token.email.toLowerCase() },
						include: {
							_count: {
								select: {
									createdCircles: true,
									Album: true,
									followers: true,
									following: true,
								},
							},
						},
					});
					if (dbUser) {
						token.id = String(dbUser.id);
						token.username = dbUser.username;
						token.image = dbUser.profileImage;
						token.circleCount = dbUser._count.createdCircles || 0;
						token.albumCount = dbUser._count.Album || 0;
						token.followersCount = dbUser._count.followers || 0;
						token.followingCount = dbUser._count.following || 0;
					}
				}

				return token;
			} catch (error) {
				console.error('Error in JWT callback:', error);
				return token;
			}
		},
	},
	trustHost: true,
});
