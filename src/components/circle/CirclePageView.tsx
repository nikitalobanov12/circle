'use client';

import { Session } from 'next-auth';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaLock } from 'react-icons/fa';

import CircleHeader from './CircleHeader';
import CircleMembers from './CircleMembers';
import CircleAlbums from './CircleAlbums';

interface CircleDetails {
	id: number;
	name: string;
	avatar: string | null;
	description: string | null;
	isPrivate: boolean;
	createdAt: string;
	membersCount: number;
	isCreator: boolean;
	isMember: boolean;
}

export default function CirclePageView({ circleId, session }: { circleId: number; session: Session | null }) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [circle, setCircle] = useState<CircleDetails | null>(null);
	const router = useRouter();

	useEffect(() => {
		const fetchCircleDetails = async () => {
			try {
				setLoading(true);
				const response = await fetch(`/api/circles/${circleId}`);

				if (!response.ok) {
					if (response.status === 404) {
						router.push('/profile');
						return;
					}
					throw new Error('Failed to fetch circle details');
				}

				const data = await response.json();
				setCircle(data);
			} catch (err) {
				console.error('Error fetching circle details:', err);
				setError('Could not load circle information. Please try again later.');
			} finally {
				setLoading(false);
			}
		};

		if (circleId) {
			fetchCircleDetails();
		}
	}, [circleId, router]);
	if (loading) {
		return (
			<div className='flex justify-center items-center min-h-screen'>
				<div className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--primary)]'></div>
			</div>
		);
	}

	if (error || !circle) {
		return (
			<div className='flex flex-col items-center justify-center min-h-screen p-4'>
				<h2 className='text-xl font-semibold text-red-500 mb-4'>Error</h2>
				<p className='text-center text-[var(--foreground)]'>{error || 'Circle not found'}</p>
				<button
					onClick={() => router.push('/profile')}
					className='mt-6 px-6 py-2 rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
				>
					Back to Profile
				</button>
			</div>
		);
	}

	// Check if user has access to view circle content
	const hasAccess = !circle.isPrivate || circle.isMember;

	return (
		<div className='min-h-screen bg-[var(--background)] text-[var(--foreground)]'>
			<div className='flex flex-col w-full max-w-xl mx-auto pb-20'>
				<CircleHeader
					circle={circle}
					session={session}
				/>

				{hasAccess ? (
					<>
						<CircleMembers circleId={circleId} />
						<CircleAlbums circleId={circleId} />
					</>
				) : (
					<div className='flex flex-col items-center justify-center py-20 px-6 text-center'>
						<div className='bg-[var(--background-secondary)] p-6 rounded-xl max-w-md'>
							<div className='flex justify-center mb-4'>
								<FaLock
									size={40}
									className='text-[var(--foreground-secondary)]'
								/>
							</div>
							<h2 className='text-xl font-semibold mb-2'>Private Circle</h2>
							<p className='text-[var(--foreground-secondary)] mb-6'>This is a private circle. You need to be a member to view its content.</p>
							{session ? (
								<p className='text-sm text-[var(--foreground-tertiary)]'>Request to join this circle to access its content.</p>
							) : (
								<button
									onClick={() => router.push('/auth/login')}
									className='px-6 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)]'
								>
									Log in to request access
								</button>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
