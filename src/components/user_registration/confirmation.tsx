import Image from 'next/image';
import { IFormData } from './register_types';

interface ConfirmationProps {
	formData: IFormData;
	onSubmit: () => Promise<void>;
	loading: boolean;
	success: boolean;
}

export default function Confirmation({ formData, onSubmit, loading, success }: ConfirmationProps) {
	return (
		<div className='flex flex-col items-center'>
			<h1 className='text-3xl font-bold mb-6'>Confirm Your Details</h1>
			
			<div className='w-full bg-[var(--background-secondary)] rounded-2xl p-6 mb-6'>
				<div className='flex flex-col items-center gap-4'>
					<div className='relative w-24 h-24 rounded-full overflow-hidden border-4 border-[var(--primary)]'>
						<Image
							src={formData.profileImage || '/images/default-avatar.png'}
							fill
							alt='Profile'
							className='object-cover'
						/>
					</div>
					
					<div className='w-full space-y-3 mt-2'>
						<div className='flex justify-between py-2 border-b border-[var(--border)]'>
							<span className='text-[var(--foreground-secondary)]'>Email</span>
							<span className='font-medium'>{formData.email}</span>
						</div>
						<div className='flex justify-between py-2 border-b border-[var(--border)]'>
							<span className='text-[var(--foreground-secondary)]'>Username</span>
							<span className='font-medium'>@{formData.username}</span>
						</div>
						<div className='flex justify-between py-2'>
							<span className='text-[var(--foreground-secondary)]'>Full Name</span>
							<span className='font-medium'>{formData.fullName}</span>
						</div>
					</div>
				</div>
			</div>

			{loading ? (
				<div className='flex items-center gap-3 py-4'>
					<div className='w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin' />
					<span>Creating your account...</span>
				</div>
			) : success ? (
				<div className='py-4 text-green-500 font-medium flex items-center gap-2'>
					<svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
						<path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
					</svg>
					Account created! Redirecting...
				</div>
			) : (
				<button
					type='button'
					className='w-full py-3 bg-[var(--primary)] text-white text-lg font-medium rounded-full hover:opacity-90 transition-opacity'
					onClick={onSubmit}
				>
					Create Account
				</button>
			)}
		</div>
	);
}
