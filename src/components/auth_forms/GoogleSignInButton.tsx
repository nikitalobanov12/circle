'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';

interface GoogleSignInButtonProps {
	text?: string;
	callbackUrl?: string;
	className?: string;
}

export default function GoogleSignInButton({
	text = 'Continue with Google',
	callbackUrl = '/home',
	className = '',
}: GoogleSignInButtonProps) {
	const [isLoading, setIsLoading] = useState(false);

	const handleGoogleSignIn = async () => {
		setIsLoading(true);
		try {
			await signIn('google', { callbackUrl });
		} catch (error) {
			console.error('Google sign-in error:', error);
			setIsLoading(false);
		}
	};

	return (
		<button
			onClick={handleGoogleSignIn}
			disabled={isLoading}
			className={`w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-[var(--border)] rounded-full font-medium transition-all hover:bg-[var(--background-secondary)] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
		>
			{isLoading ? (
				<div className='w-5 h-5 border-2 border-[var(--foreground)] border-t-transparent rounded-full animate-spin' />
			) : (
				<FcGoogle className='w-5 h-5' />
			)}
			<span>{isLoading ? 'Signing in...' : text}</span>
		</button>
	);
}
