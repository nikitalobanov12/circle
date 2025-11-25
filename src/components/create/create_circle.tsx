'use client';
import CreateCircleTopBar from '@/components/create/circle/top_bar';
import { useState, useEffect } from 'react';
import { Session } from 'next-auth';
import CreateCircleStepOne from './circle/step_one';
import CircleAvatar from './circle/circle_avatar';
import { ICircleFormData } from './circle/circle_types';
import { useRouter, useSearchParams } from 'next/navigation';
import CreateCircleStepTwo from './circle/step_two';
import CreateCircleStepThree from './circle/step_three';

export default function CreateCircle({ session }: { session: Session | null }) {
	const userId: number = Number(session?.user?.id);
	const router = useRouter();
	const searchParams = useSearchParams();
	const returnToAlbum = searchParams.get('returnToAlbum') === 'true';
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState<ICircleFormData>({
		avatar: '',
		name: '',
		isPrivate: false,
		members: [],
		creatorId: userId,
	});

	// Show notification if we're returning to album creation
	const [showReturnNotice, setShowReturnNotice] = useState(returnToAlbum);

	const [friends, setFriends] = useState([]);
	const [step, setStep] = useState(1);

	const handleBack = () => {
		router.push('/profile');
	};
	const handleSubmit = async () => {
		if (formData.name.trim() === '') {
			alert('Please enter a circle name');
			return;
		}

		try {
			setIsSubmitting(true);
			console.log('Sending formdata to server...', formData);

			const response = await fetch('/api/create/circle', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ formData }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to create circle');
			}

			console.log('Circle created successfully:', data);
			// Check if we need to return to album creation process
			if (returnToAlbum && data.circle && data.circle.id) {
				// Navigate to the return handler page
				router.push(`/create/circle/return-to-album?circleId=${data.circle.id}`);
			} else if (data.circle && data.circle.id) {
				router.push(`/circle/${data.circle.id}`);
			} else {
				router.push('/profile');
			}
		} catch (error) {
			console.error('Error creating circle:', error);
			alert('Failed to create circle. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const getFriends = async () => {
		try {
			const response = await fetch('/api/users/friends', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ userId: session?.user?.id }),
			});

			if (!response.ok) throw new Error('Error obtaining friends from server');
			const friends = await response.json();
			console.log('FRIENDS FROM SERVER', friends.data);
			return friends.data;
		} catch (err) {
			console.error('Failure to render add friends step');
			return [];
		}
	};

	const handleNext = async () => {
		console.log(formData);
		console.log('STEP: ', step);
		if (step === 1) {
			const friends = await getFriends();
			setFriends(friends);
			setStep(2);
		}

		if (step === 2) {
			console.log(formData.members);
			setStep(3);
		}

		if (step === 3) {
			handleSubmit();
		}
	};
	return (
		<div className='min-h-screen bg-[var(--background)]'>
			<div className='flex flex-col h-full w-full max-w-xl mx-auto'>
				{showReturnNotice && (
					<div className='bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4'>
						<div className='flex items-center'>
							<div className='flex-shrink-0'>
								<svg
									className='h-5 w-5 text-blue-500'
									viewBox='0 0 20 20'
									fill='currentColor'
								>
									<path
										fillRule='evenodd'
										d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z'
										clipRule='evenodd'
									/>
								</svg>
							</div>
							<div className='ml-3'>
								<p className='text-sm'>You&apos;ll be returned to your album creation after creating this circle.</p>
							</div>
							<div className='ml-auto'>
								<button
									type='button'
									onClick={() => setShowReturnNotice(false)}
									className='text-blue-500 hover:text-blue-700 focus:outline-none'
								>
									<svg
										className='h-4 w-4'
										fill='currentColor'
										viewBox='0 0 20 20'
									>
										<path
											fillRule='evenodd'
											d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
											clipRule='evenodd'
										/>
									</svg>
								</button>
							</div>
						</div>
					</div>
				)}

				<CreateCircleTopBar
					step={step}
					onClick={() => {
						handleNext();
						// setStep(2);
					}}
					onClickTwo={handleBack}
					// isSubmitting={}
				/>

				{step === 1 && (
					<div className='flex flex-col items-center px-4 mt-6'>
						<CircleAvatar
							avatar={formData.avatar}
							setFormData={setFormData}
						/>

						<div className='w-full mt-6'>
							<CreateCircleStepOne
								formData={formData}
								setFormData={setFormData}
							/>
						</div>
					</div>
				)}

				{step === 2 && (
					<CreateCircleStepTwo
						friends={friends}
						setFormData={setFormData}
						formData={formData}
					/>
				)}

				{step === 3 && (
					<CreateCircleStepThree
						formData={formData}
						setFormData={setFormData}
						friends={friends}
						setFriends={setFriends}
					/>
				)}
			</div>
		</div>
	);
}
