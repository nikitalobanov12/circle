'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

import RegisterEmailDescription from '@/components/user_registration/enter_email/email_description';
import RegisterEmailHeader from '@/components/user_registration/enter_email/email_header';
import { BackButton } from '@/components/user_registration/back_button';
import EnterEmail from '@/components/user_registration/enter_email/enter_email';
import { RegisterPasswordHeader } from '@/components/user_registration/create_password/password_header';
import RegisterPasswordDescription from '@/components/user_registration/create_password/password_description';
import CreatePassword from '@/components/user_registration/create_password/create_password';
import RegisterFullnameHeader from '@/components/user_registration/enter_fullname/fullname_header';
import RegisterFullnameDescription from '@/components/user_registration/enter_fullname/fullname_description';
import EnterFullname from '@/components/user_registration/enter_fullname/enter_fullname';
import RegisterUsernameDescription from '@/components/user_registration/create_username/username_description';
import RegisterUsernameHeader from '@/components/user_registration/create_username/username_header';
import CreateUsername from '@/components/user_registration/create_username/create_username';
import AddProfilePicture from '@/components/user_registration/add_profilepicture/add_profilepicture';
import Confirmation from '@/components/user_registration/confirmation';
import GoogleSignInButton from '@/components/auth_forms/GoogleSignInButton';
import CirclesLogo from '@/components/Circles_Logo';
import dynamic from 'next/dynamic';

// Dynamically import the OnboardingTutorial to avoid hydration issues with localStorage
const OnboardingTutorial = dynamic(() => import('@/components/onboarding/OnboardingTutorial'), {
	ssr: false,
});

export default function Register() {
	const router = useRouter();
	const [formData, setFormData] = useState({
		email: '',
		confirmEmail: '',
		password: '',
		confirmPassword: '',
		fullName: '',
		firstName: '',
		lastName: '',
		username: '',
		profileImage: '',
	});
	const [step, setStep] = useState(0); // Start at step 0 for initial screen
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [showOnboarding, setShowOnboarding] = useState(false);
	const [registrationError, setRegistrationError] = useState<string | null>(null);

	const handleBack = () => {
		setRegistrationError(null);

		if (step === 0) {
			router.push('/');
			return;
		}

		if (step === 1) {
			setStep(0);
			return;
		}

		setStep(prev => prev - 1);
	};

	const handleRegisterEmail = () => {
		setRegistrationError(null);

		if (formData.email.length === 0 || formData.confirmEmail.length === 0) {
			setRegistrationError('Must enter an email');
			return;
		}

		if (formData.email !== formData.confirmEmail) {
			setRegistrationError('Emails do not match!');
			return;
		}

		if (step === 1 && formData.email === formData.confirmEmail) {
			setStep(prev => prev + 1);
		}
	};

	const handleRegisterPassword = () => {
		setRegistrationError(null);

		if (!formData.password || !formData.confirmPassword) {
			setRegistrationError('Please complete all password fields');
			return;
		}

		if (formData.password !== formData.confirmPassword) {
			setRegistrationError('Passwords do not match');
			return;
		}

		if (step === 2) {
			setStep(prev => prev + 1);
		}
	};

	const handleRegisterFullname = () => {
		if (!formData.fullName) {
			setRegistrationError('Enter your full name');
			return;
		}

		if (step === 3) setStep(prev => prev + 1);
	};

	const handleCreateUsername = () => {
		setRegistrationError(null);

		if (!formData.username || formData.username.trim() === '') {
			setRegistrationError('Username is required');
			return;
		}

		if (formData.username.length < 3) {
			setRegistrationError('Username must be at least 3 characters long');
			return;
		}

		if (formData.username.length > 20) {
			setRegistrationError('Username must be at most 20 characters long');
			return;
		}

		if (!/^[a-z0-9_-]+$/.test(formData.username)) {
			setRegistrationError('Username can only contain lowercase letters, numbers, underscores (_) and hyphens (-)');
			return;
		}

		if (!/^[a-z]/.test(formData.username)) {
			setRegistrationError('Username must start with a lowercase letter');
			return;
		}

		if (/[-_]$/.test(formData.username)) {
			setRegistrationError('Username cannot end with a hyphen (-) or underscore (_)');
			return;
		}

		if (step === 4) setStep(prev => prev + 1);
	};

	const handleUploadProfileImage = () => {
		setStep(prev => prev + 1);
	};

	const handleCreateProfile = async () => {
		setLoading(true);
		setSuccess(false);
		setRegistrationError(null);

		try {
			const response = await fetch('/api/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ formData }),
			});

			const data = await response.json();

			if (response.ok) {
				setSuccess(true);
				const result = await signIn('credentials', {
					email: formData.email,
					password: formData.password,
					redirect: false,
				});

				if (result?.ok) {
					setShowOnboarding(true);
				} else {
					setRegistrationError('Account created but login failed. Please try logging in manually.');
					setTimeout(() => router.push('/auth/login'), 3000);
				}
			} else {
				if (data.field) {
					if (data.field === 'email') {
						setStep(1);
						setRegistrationError(data.error);
					} else if (data.field === 'username') {
						setStep(4);
						setRegistrationError(data.error);
					}
				} else if (data.details) {
					setRegistrationError(`Validation failed: ${data.details.map((d: any) => d.message).join(', ')}`);
				} else {
					setRegistrationError(data.error || 'Failed to create account. Please try again.');
				}
			}
		} catch (error: unknown) {
			console.error('Registration error:', error);
			setRegistrationError('Network error. Please check your connection and try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='min-h-screen bg-[var(--background)] text-[var(--foreground)]'>
			<div className='max-w-md mx-auto px-6 pb-8'>
				{/* Back button - only show after step 0 */}
				{step > 0 && (
					<div className='pt-6 pb-4'>
						<BackButton handleBack={handleBack} />
					</div>
				)}

				{/* Error message */}
				{registrationError && (
					<div className='mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg'>
						<p className='text-red-500 text-sm font-medium'>{registrationError}</p>
					</div>
				)}

				{/* Step 0: Initial screen with Google option */}
				{step === 0 && (
					<div className='flex flex-col items-center pt-16'>
						<CirclesLogo />
						<h1 className='text-2xl font-bold mt-6 mb-2 text-center'>Create your account</h1>
						<p className='text-[var(--foreground-secondary)] text-center mb-8'>
							Join Circles to share moments with your friends
						</p>

						<div className='w-full space-y-4'>
							<GoogleSignInButton 
								text='Sign up with Google' 
								callbackUrl='/home' 
							/>

							{/* Divider */}
							<div className='flex items-center gap-4'>
								<div className='flex-1 h-px bg-[var(--border)]' />
								<span className='text-sm text-[var(--foreground-secondary)]'>or</span>
								<div className='flex-1 h-px bg-[var(--border)]' />
							</div>

							<button
								onClick={() => setStep(1)}
								className='w-full py-3 bg-[var(--primary)] text-white rounded-full font-medium hover:opacity-90 transition-opacity'
							>
								Sign up with email
							</button>
						</div>

						<p className='mt-8 text-sm text-[var(--foreground-secondary)]'>
							Already have an account?{' '}
							<Link href='/auth/login' className='text-[var(--primary)] font-medium hover:underline'>
								Sign in
							</Link>
						</p>
					</div>
				)}

				{/* Step 1: Email */}
				{step === 1 && (
					<div className='pt-4'>
						<div className='mb-8'>
							<RegisterEmailHeader />
							<RegisterEmailDescription />
						</div>
						<EnterEmail
							formData={formData}
							setFormData={setFormData}
							onNext={handleRegisterEmail}
						/>
					</div>
				)}

				{/* Step 2: Password */}
				{step === 2 && (
					<div className='pt-4'>
						<div className='mb-8'>
							<RegisterPasswordHeader />
							<RegisterPasswordDescription />
						</div>
						<CreatePassword
							formData={formData}
							setFormData={setFormData}
							onNext={handleRegisterPassword}
						/>
					</div>
				)}

				{/* Step 3: Full name */}
				{step === 3 && (
					<div className='pt-4'>
						<div className='mb-8'>
							<RegisterFullnameHeader />
							<RegisterFullnameDescription />
						</div>
						<EnterFullname
							formData={formData}
							setFormData={setFormData}
							onNext={handleRegisterFullname}
						/>
					</div>
				)}

				{/* Step 4: Username */}
				{step === 4 && (
					<div className='pt-4'>
						<div className='mb-8'>
							<RegisterUsernameHeader />
							<RegisterUsernameDescription />
						</div>
						<CreateUsername
							formData={formData}
							setFormData={setFormData}
							onNext={handleCreateUsername}
						/>
					</div>
				)}

				{/* Step 5: Profile picture */}
				{step === 5 && (
					<div className='pt-4'>
						<div className='mb-8'>
							<h1 className='text-3xl font-bold mb-2'>Add a profile picture</h1>
							<p className='text-[var(--foreground-secondary)]'>
								Add a profile picture so your friends know it&apos;s you. Everyone will be able to see your picture.
							</p>
						</div>
						<AddProfilePicture
							formData={formData}
							setFormData={setFormData}
							onNext={handleUploadProfileImage}
						/>
					</div>
				)}

				{/* Step 6: Confirmation */}
				{step === 6 && (
					<div className='pt-4'>
						<Confirmation
							formData={formData}
							onSubmit={handleCreateProfile}
							loading={loading}
							success={success}
						/>
					</div>
				)}

				{/* Onboarding tutorial */}
				{showOnboarding && (
					<OnboardingTutorial
						onComplete={() => {
							setShowOnboarding(false);
							router.push('/home');
						}}
					/>
				)}
			</div>
		</div>
	);
}
