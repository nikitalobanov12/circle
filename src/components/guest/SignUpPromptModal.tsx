'use client';

import { useGuest } from '@/components/providers/GuestProvider';
import Link from 'next/link';
import { FaTimes } from 'react-icons/fa';

export default function SignUpPromptModal() {
	const { showSignUpPrompt, signUpPromptAction, dismissSignUpPrompt } = useGuest();

	if (!showSignUpPrompt) return null;

	const actionText = signUpPromptAction 
		? `Sign up to ${signUpPromptAction}`
		: 'Sign up to unlock all features';

	return (
		<div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4'>
			<div className='relative bg-background rounded-xl p-6 max-w-sm w-full shadow-xl'>
				<button
					onClick={dismissSignUpPrompt}
					className='absolute top-4 right-4 text-foreground-secondary hover:text-foreground'
					aria-label='Close'
				>
					<FaTimes />
				</button>

				<div className='text-center'>
					<h3 className='text-xl font-bold mb-2'>Join Circles</h3>
					<p className='text-foreground-secondary mb-6'>
						{actionText}. Create an account to like photos, comment on albums, and join circles.
					</p>

					<div className='flex flex-col gap-3'>
						<Link
							href='/auth/register'
							onClick={dismissSignUpPrompt}
							className='w-full py-3 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-center'
						>
							Create Account
						</Link>
						<Link
							href='/auth/login'
							onClick={dismissSignUpPrompt}
							className='w-full py-3 border-2 border-foreground/20 rounded-lg font-medium hover:bg-foreground/5 transition-colors text-center'
						>
							Sign In
						</Link>
						<button
							onClick={dismissSignUpPrompt}
							className='text-sm text-foreground-secondary hover:text-foreground'
						>
							Continue browsing as guest
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
