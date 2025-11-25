'use client';

import { LoginButton } from './login_buttons';
import { UsernameEmailOrPhoneNumberLoginInput } from './username_email_phonenumber_input';
import { PasswordInput } from './password_input';
import { RememberMe } from './remember_user_checkbox';
import { ForgotPassword } from './forgot_password';
import CirclesLogo from '../Circles_Logo';
import { DontHaveAnAccountSignUp } from './dont_have_an_account';
import GoogleSignInButton from './GoogleSignInButton';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export function LoginForm() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		const formData = new FormData(e.currentTarget);
		const email = (formData.get('email') as string).toLowerCase();
		const password = formData.get('password') as string;

		try {
			const result = await signIn('credentials', {
				email,
				password,
				redirect: false,
			});

			if (result?.error) {
				setError('Invalid email or password');
				setIsLoading(false);
			} else if (result?.ok) {
				window.location.href = '/home';
			}
		} catch (error) {
			console.error('An error occurred during login', error);
			setError('An error occurred. Please try again.');
			setIsLoading(false);
		}
	};

	return (
		<div className='flex flex-col items-center pt-16 px-4 max-w-md mx-auto'>
			<div className='mb-8'>
				<CirclesLogo />
			</div>

			{error && (
				<div className='w-full mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg'>
					<p className='text-red-500 text-sm text-center'>{error}</p>
				</div>
			)}

			<form onSubmit={handleSubmit} className='w-full'>
				<div className='flex flex-col gap-3'>
					<UsernameEmailOrPhoneNumberLoginInput />
					<PasswordInput />
				</div>

				<div className='flex justify-between items-center my-5'>
					<RememberMe />
					<ForgotPassword />
				</div>

				<LoginButton isLoading={isLoading} disabled={isLoading} />
			</form>

			{/* Divider */}
			<div className='w-full flex items-center gap-4 my-6'>
				<div className='flex-1 h-px bg-[var(--border)]' />
				<span className='text-sm text-[var(--foreground-secondary)]'>or</span>
				<div className='flex-1 h-px bg-[var(--border)]' />
			</div>

			{/* Google Sign In */}
			<div className='w-full'>
				<GoogleSignInButton text='Sign in with Google' callbackUrl='/home' />
			</div>

			<div className='mt-8'>
				<DontHaveAnAccountSignUp />
			</div>
		</div>
	);
}
