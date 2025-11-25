'use client';
import React, { useState, useEffect } from 'react';
import { Session } from 'next-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import CreateAlbumTopBar from './album/top_bar';
import CreateAlbumStepOne from './album/step_one';
import CreateAlbumStepTwo from './album/step_two';
import CreateAlbumStepThree from './album/step_three';
import { useAlbumCreation } from './album/AlbumCreationContext';

// Define the photo type that is used in the album
export interface AlbumPhoto {
	file?: File;
	previewUrl: string;
	description: string;
	uploading: boolean;
	uploaded: boolean;
	error?: string;
}

export default function CreateAlbum({ session }: { session: Session | null }) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const circleId = searchParams.get('circleId');
	const newlyCreatedCircleId = searchParams.get('newCircleId');

	// Use our context instead of local state
	const { albumData, setAlbumData, currentStep, setCurrentStep } = useAlbumCreation();

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Initialize album data if needed
	useEffect(() => {
		// If we have a newly created circle ID from URL, update it in the context
		if (newlyCreatedCircleId && albumData.photos.length > 0) {
			setAlbumData(prev => ({
				...prev,
				circleId: newlyCreatedCircleId,
			}));

			// Set success message
			setError('Circle created! You can now continue with your album.');

			// Clear the error after a few seconds
			setTimeout(() => {
				setError(null);
			}, 3000);

			// Move to step 3
			setCurrentStep(3);
		}
		// If this is the first load and we have a circleId from URL param
		else if (circleId && !albumData.circleId && albumData.photos.length === 0) {
			setAlbumData(prev => ({
				...prev,
				creatorId: session?.user?.id,
				circleId: circleId,
			}));
		}
		// If we have no album data yet, initialize with user ID
		else if (!albumData.creatorId && session?.user?.id) {
			setAlbumData(prev => ({
				...prev,
				creatorId: session?.user?.id,
			}));
		}
	}, [circleId, newlyCreatedCircleId, session?.user?.id, albumData, setAlbumData, setCurrentStep]);

	const handleBack = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
		} else {
			router.push('/profile');
		}
	};

	const handleNext = () => {
		// Clear any previous errors
		setError(null);

		// For Step 1, validate that at least one photo is added
		if (currentStep === 1) {
			if (albumData.photos.length === 0) {
				setError('Please add at least one photo to continue');
				return;
			}
		}

		// Move to next step if not on last step
		if (currentStep < 3) {
			setCurrentStep(currentStep + 1);
		}
	};

	const handleSubmit = async () => {
		try {
			// Clear any previous errors
			setError(null);

			// Validate title
			if (!albumData.title || albumData.title.trim().length === 0) {
				setError('Please enter a title for your album');
				return;
			}

			// Check if we have missing File objects in our photos array
			const hasInvalidPhotos = albumData.photos.some(photo => !photo.file);

			if (hasInvalidPhotos) {
				setError('Some photos are missing their file data. Please re-upload them in step 1.');
				setCurrentStep(1);
				return;
			}

			setIsSubmitting(true);
			console.log('Sending album data to server...', albumData);

			// Find the index of the selected cover image (which currently has a blob URL)
			const selectedCoverIndex = albumData.photos.findIndex(photo => photo.previewUrl === albumData.coverImage);

			// First, create the album without a cover image
			const response = await fetch('/api/create/album', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					formData: {
						title: albumData.title,
						description: albumData.description,
						coverImage: null, // Don't set the cover image yet - it's currently a blob URL
						isPrivate: albumData.isPrivate,
						creatorId: albumData.creatorId,
						circleId: albumData.circleId,
					},
				}),
			});

			let data;
			try {
				data = await response.json();
			} catch (parseError) {
				console.error('Error parsing album creation response:', parseError);
				throw new Error('Failed to parse server response');
			}

			if (!response.ok) {
				// Handle specific error cases
				if (response.status === 403) {
					throw new Error(data.error || 'You do not have permission to create an album in this circle');
				} else {
					throw new Error(data.error || 'Failed to create album');
				}
			}

			console.log('Album created successfully:', data);
			const albumId = data.album.id;

			if (albumData.photos && albumData.photos.length > 0) {
				console.log(`Uploading ${albumData.photos.length} photos to album ${albumId}`);

				// Update photos to mark them as uploading
				setAlbumData(prev => ({
					...prev,
					photos: prev.photos.map(photo => ({
						...photo,
						uploading: true,
						uploaded: false,
					})),
				}));

				// Track upload success/failure
				let failedUploads = 0;
				let successfulUploads = 0;

				for (let i = 0; i < albumData.photos.length; i++) {
					const photo = albumData.photos[i];
					const isSelectedCoverImage = selectedCoverIndex === i;

					try {
						if (!photo.file) {
							console.error(`Photo at index ${i} is missing its file`);
							failedUploads++;
							continue;
						}

						const photoFormData = new FormData();
						photoFormData.append('file', photo.file);
						photoFormData.append('description', photo.description || '');

						// If this is the selected cover image, mark it as such
						if (isSelectedCoverImage) {
							photoFormData.append('isCoverImage', 'true');
						}

						console.log(`Uploading photo to /api/albums/${albumId}/photos`, photo.file.name);
						// Check if file is too large (Cloudinary free tier has a 5MB limit)
						if (photo.file.size > 5 * 1024 * 1024) {
							console.error(`File ${photo.file.name} is too large (${(photo.file.size / 1024 / 1024).toFixed(2)}MB). Max size is 5MB.`);

							// Mark file as error
							setAlbumData(prev => ({
								...prev,
								photos: prev.photos.map((p, index) => (index === i ? { ...p, uploading: false, error: 'File too large (max 5MB)' } : p)),
							}));
							failedUploads++;
							continue;
						}
						const uploadResponse = await fetch(`/api/albums/${albumId}/photos`, {
							method: 'POST',
							body: photoFormData,
						});

						let responseData;
						try {
							responseData = await uploadResponse.json();
							console.log('Photo upload response:', responseData);

							// Mark photo as uploaded
							setAlbumData(prev => ({
								...prev,
								photos: prev.photos.map((p, index) => (index === i ? { ...p, uploading: false, uploaded: true } : p)),
							}));
							successfulUploads++;
						} catch (parseError) {
							console.error('Error parsing response:', parseError);

							// Mark photo as failed
							setAlbumData(prev => ({
								...prev,
								photos: prev.photos.map((p, index) => (index === i ? { ...p, uploading: false, error: 'Upload failed' } : p)),
							}));
							failedUploads++;
						}

						if (!uploadResponse.ok) {
							console.error('Photo upload failed with status:', uploadResponse.status);
							console.error('Response data:', responseData);

							// Mark photo as failed
							setAlbumData(prev => ({
								...prev,
								photos: prev.photos.map((p, index) => (index === i ? { ...p, uploading: false, error: `Upload failed (${uploadResponse.status})` } : p)),
							}));
							failedUploads++;
						}
					} catch (error) {
						console.error('Error uploading photo:', error);

						// Mark photo as failed
						setAlbumData(prev => ({
							...prev,
							photos: prev.photos.map((p, index) => (index === i ? { ...p, uploading: false, error: 'Upload failed' } : p)),
						}));
						failedUploads++;

						// Continue with other photos even if one fails
					}
				}

				// Show summary message based on upload results
				if (failedUploads > 0) {
					setError(`Album created with ${successfulUploads} photo(s). ${failedUploads} photo(s) failed to upload.`);

					// Delay redirect to show the error message
					setTimeout(() => {
						router.push('/');
					}, 3000);
				} else {
					// Small delay to show completion status
					setTimeout(() => {
						router.push('/');
					}, 1000);
				}
			} else {
				router.push('/');
			}
		} catch (error) {
			console.error('Error creating album:', error);
			setError(error instanceof Error ? error.message : 'Failed to create album. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const renderStepContent = () => {
		switch (currentStep) {
			case 1:
				return (
					<div className='w-full'>
						<CreateAlbumStepOne
							formData={albumData}
							setFormData={setAlbumData}
							onNext={handleNext}
						/>
					</div>
				);
			case 2:
				return (
					<div className='w-full'>
						<CreateAlbumStepTwo
							formData={albumData}
							setFormData={setAlbumData}
							onNext={handleNext}
						/>
					</div>
				);
			case 3:
				return (
					<div className='w-full'>
						<CreateAlbumStepThree
							formData={albumData}
							setFormData={setAlbumData}
							onSubmit={handleSubmit}
							isSubmitting={isSubmitting}
						/>
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<div className='min-h-screen bg-[var(--background)]'>
			<div className='flex flex-col pb-24 pt-8 w-full max-w-xl mx-auto'>
				{' '}
				<CreateAlbumTopBar
					onClick={currentStep === 3 ? handleSubmit : handleNext}
					onClickTwo={handleBack}
					isSubmitting={isSubmitting}
					currentStep={currentStep}
				/>{' '}
				<div className='flex flex-col items-center px-4 mt-6'>
					{' '}
					{error && (
						<div
							className='w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative'
							role='alert'
						>
							<span className='block sm:inline'>{error}</span>
						</div>
					)}
					<div className='flex justify-center items-center gap-3 mb-6'>
						{[1, 2, 3].map(step => (
							<React.Fragment key={step}>
								<div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentStep >= step ? 'bg-[var(--primary)] opacity-100 transform scale-110' : 'bg-[var(--foreground)] opacity-30'}`} />
								{step < 3 && <div className={`h-0.5 w-7 transition-all duration-300 ${currentStep > step ? 'bg-[var(--primary)] opacity-100' : 'bg-[var(--foreground)] opacity-20'}`} />}
							</React.Fragment>
						))}
					</div>
					<div className='w-full animate-[fadeIn_0.3s_ease-out]'>{renderStepContent()}</div>
				</div>
			</div>
		</div>
	);
}
