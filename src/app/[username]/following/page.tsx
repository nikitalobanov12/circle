'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import UserCard from '@/components/search/UserCard';
import NavBar from '@/components/bottom_bar/NavBar';

interface User {
	id: number;
	name: string;
	username: string;
	profileImage?: string;
}

export default function FollowingPage() {
	const [following, setFollowing] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [isPrivate, setIsPrivate] = useState(false);
	const [isOwnProfile, setIsOwnProfile] = useState(false);
	const params = useParams();
	const username = params.username ? String(params.username) : '';

	useEffect(() => {
		const fetchFollowing = async () => {
			try {
				setLoading(true);
				const res = await fetch(`/api/users/${username}/following`);

				if (!res.ok) {
					const errorData = await res.json();
					if (errorData.isPrivate) {
						// Handle private profile
						setIsPrivate(true);
						setIsOwnProfile(errorData.isOwnProfile || false);
						setFollowing([]);
						return;
					}
					throw new Error('Failed to fetch following');
				}

				const data = await res.json();
				setFollowing(data);
			} catch (error) {
				console.error('Failed to fetch following:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchFollowing();

		// Listen for global follow/unfollow events to refresh the list
		const handleRefresh = () => {
			fetchFollowing();
		};

		window.addEventListener('refreshUsers', handleRefresh);

		return () => {
			window.removeEventListener('refreshUsers', handleRefresh);
		};
	}, [username]);

	if (loading) return <p className='text-center text-[var(--foreground)]'>Loading...</p>;

	return (
		<>
			<div className='min-h-screen bg-[var(--background)]'>
				<div className='w-full max-w-xl mx-auto px-4 pt-6 pb-20'>
					<h1 className='text-2xl font-bold text-[var(--foreground)] mb-4'>Following</h1>

					{isPrivate && !isOwnProfile ? (
						<div className='py-8 flex flex-col items-center'>
							<div className='w-16 h-16 flex items-center justify-center bg-[var(--background-secondary)] rounded-full'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									className='h-8 w-8 text-[var(--foreground-secondary)]'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
									/>
								</svg>
							</div>
							<p className='mt-4 text-[var(--foreground)] text-lg'>This user has a private profile.</p>
							<p className='text-[var(--foreground-secondary)] text-sm'>Follow them to see who they follow.</p>
						</div>
					) : following.length > 0 ? (
						<div className='space-y-4'>
							{following.map(user => (
								<UserCard
									key={user.id}
									user={user}
								/>
							))}
						</div>
					) : (
						<p className='text-[var(--foreground)] text-center'>No following found.</p>
					)}
				</div>
			</div>
			<NavBar />
		</>
	);
}
