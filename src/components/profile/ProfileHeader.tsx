'use client';
import { Settings, Check, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Session } from 'next-auth';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';

interface ProfileUser {
	id: number;
	username: string;
	name?: string | null;
	bio?: string | null;
	profileImage?: string | null;
	coverImage?: string | null;
	isProfilePrivate?: boolean;
	circlesCount: number;
	albumsCount: number;
	followersCount: number;
	followingCount: number;
	isFollowing: boolean;
	isOwnProfile: boolean;
}

interface ProfileHeaderProps {
	profileData?: ProfileUser;
	session: Session | null;
	onFollowUpdate?: (isFollowing: boolean) => void;
}

export default function ProfileHeader({ profileData, session, onFollowUpdate }: ProfileHeaderProps) {
	const router = useRouter();
	const defaultProfileData = useMemo(() => ({
		id: -1,
		username: 'user',
		name: '',
		bio: '',
		profileImage: '',
		coverImage: '',
		isProfilePrivate: false,
		circlesCount: 0,
		albumsCount: 0,
		followersCount: 0,
		followingCount: 0,
		isFollowing: false,
		isOwnProfile: true,
	}), []);

	const profile = profileData || defaultProfileData;
	const [isFollowing, setIsFollowing] = useState(profile.isFollowing);
	const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false);
	const [followersCount, setFollowersCount] = useState(profile.followersCount);
	const [followingCount, setFollowingCount] = useState(profile.followingCount);
	const [requestSent, setRequestSent] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [isMessageProcessing, setIsMessageProcessing] = useState(false);

	// Memoize the check request status function to prevent unnecessary re-renders
	const checkRequestStatus = useCallback(async () => {
		if (!session?.user || !profileData || profileData.isOwnProfile || profileData.isFollowing || !profileData.isProfilePrivate) {
			return;
		}

		try {
			const response = await fetch(`/api/users/follow?targetUserId=${profileData.id}&checkRequestStatus=true`);
			if (response.ok) {
				const data = await response.json();
				setRequestSent(data.requestSent || false);
			}
		} catch (error) {
			console.error('Error checking follow request status:', error);
		}
	}, [session?.user, profileData]);

	useEffect(() => {
		if (profileData) {
			setIsFollowing(profileData.isFollowing || false);
			setFollowersCount(profileData.followersCount || 0);
			setFollowingCount(profileData.followingCount || 0);

			// Only check request status for private profiles that aren't being followed
			if (profileData.isProfilePrivate && !profileData.isFollowing && !profileData.isOwnProfile) {
				checkRequestStatus();
			}
		}
	}, [profileData, checkRequestStatus]);
	const handleUploadClick = useCallback(() => {
		// Only allow upload if it's user's OWN profile
		if (profile.isOwnProfile) {
			document.getElementById('upload-profile-pic')?.click();
		}
	}, [profile.isOwnProfile]);

	const handleChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const formData = new FormData();
		formData.append('avatar', file);
		await fetch('/api/user/avatar', { method: 'POST', body: formData });
		window.location.reload();
	}, []);

	const handleFollowAction = async () => {
		if (!session) {
			// Redirect to login if not authenticated
			window.location.href = '/auth/login';
			return;
		}

		if (isProcessing) return; // Prevent multiple rapid clicks
		setIsProcessing(true);

		// Make sure onFollowUpdate is defined
		const updateFollowState = onFollowUpdate || (() => {});

		if (showUnfollowConfirm) {
			// Optimistically update UI
			setShowUnfollowConfirm(false);
			setIsFollowing(false);
			setFollowersCount(count => Math.max(0, count - 1));
			updateFollowState(false);

			// Show loading toast
			const toastId = toast.loading('Unfollowing user...');

			try {
				const response = await fetch('/api/users/follow', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ targetUserId: profile.id, action: 'unfollow' }),
				});

				if (!response.ok) {
					throw new Error('Failed to unfollow user');
				}

				const data = await response.json();
				if (data.followerCount !== undefined) setFollowersCount(data.followerCount);
				if (data.followingCount !== undefined) setFollowingCount(data.followingCount);
				toast.success('Unfollowed successfully', { id: toastId });

				// Trigger global refresh
				const refreshEvent = new CustomEvent('refreshUsers');
				window.dispatchEvent(refreshEvent);
			} catch (error) {
				console.error('Error unfollowing user:', error);
				// Revert optimistic update if there's an error
				setIsFollowing(true);
				setFollowersCount(count => count + 1);
				updateFollowState(true);
				toast.error('Failed to unfollow user', { id: toastId });
			} finally {
				setIsProcessing(false);
			}
			return;
		}

		if (isFollowing) {
			setShowUnfollowConfirm(true);
			setIsProcessing(false);
		} else {
			// For private profiles, we send a follow request instead of immediately following
			if (profile.isProfilePrivate) {
				// Optimistically update UI for request sent state
				setRequestSent(true);

				// Show loading toast
				const toastId = toast.loading('Sending follow request...');

				try {
					const response = await fetch('/api/users/follow', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ targetUserId: profile.id, action: 'follow' }),
					});

					if (!response.ok) {
						throw new Error('Failed to send follow request');
					}

					const data = await response.json();
					if (data.action === 'request_sent') {
						toast.success('Follow request sent', { id: toastId });
					} else if (data.action === 'followed') {
						// In case the user is not private (unlikely unless changed during this session)
						setIsFollowing(true);
						setFollowersCount(data.followerCount || followersCount + 1);
						updateFollowState(true);
						toast.success('Following user', { id: toastId });
					}

					// Trigger global refresh
					const refreshEvent = new CustomEvent('refreshUsers');
					window.dispatchEvent(refreshEvent);
				} catch (error) {
					console.error('Error sending follow request:', error);
					// Revert optimistic update
					setRequestSent(false);
					toast.error('Failed to send follow request', { id: toastId });
				} finally {
					setIsProcessing(false);
				}
			} else {
				// For public profiles, immediately follow with optimistic update
				setIsFollowing(true);
				setFollowersCount(count => count + 1);
				updateFollowState(true);

				// Show loading toast
				const toastId = toast.loading('Following user...');

				try {
					const response = await fetch('/api/users/follow', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ targetUserId: profile.id, action: 'follow' }),
					});

					if (!response.ok) {
						throw new Error('Failed to follow user');
					}

					const data = await response.json();
					if (data.followerCount !== undefined) setFollowersCount(data.followerCount);
					if (data.followingCount !== undefined) setFollowingCount(data.followingCount);

					toast.success('Following user', { id: toastId });

					// Trigger global refresh
					const refreshEvent = new CustomEvent('refreshUsers');
					window.dispatchEvent(refreshEvent);
				} catch (error) {
					console.error('Error following user:', error);
					// Revert optimistic update if there's an error
					setIsFollowing(false);
					setFollowersCount(count => Math.max(0, count - 1));
					updateFollowState(false);
					toast.error('Failed to follow user', { id: toastId });
				} finally {
					setIsProcessing(false);
				}
			}
		}
	};

	const handleMessageClick = async () => {
		if (!session) {
			window.location.href = '/auth/login';
			return;
		}

		if (isMessageProcessing) return;
		setIsMessageProcessing(true);

		const toastId = toast.loading('Opening conversation...');

		try {
			const response = await fetch('/api/messages/conversations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ participantId: profile.id }),
			});

			if (!response.ok) {
				throw new Error('Failed to create conversation');
			}

			const data = await response.json();
			toast.dismiss(toastId);
			router.push(`/messages/${data.id}`);
		} catch (error) {
			console.error('Error creating conversation:', error);
			toast.error('Failed to open conversation', { id: toastId });
		} finally {
			setIsMessageProcessing(false);
		}
	};

	return (
		<div className='relative flex flex-col items-center mb-6 rounded-2xl py-4 px-6'>
			{profile.isOwnProfile && (
				<input
					type='file'
					id='upload-profile-pic'
					className='hidden'
					accept='image/*'
					onChange={handleChange}
				/>
			)}{' '}
			<Image
				src={profile.profileImage || '/images/default-avatar.png'}
				alt='Profile'
				width={96}
				height={96}
				className={`w-24 h-24 rounded-full object-cover ${profile.isOwnProfile ? 'cursor-pointer' : ''}`}
				onClick={handleUploadClick}
			/>
			{profile.isProfilePrivate && (
				<div className='absolute top-4 left-4 bg-gray-800 text-white text-xs px-2 py-1 rounded-full flex items-center'>
					<svg
						xmlns='http://www.w3.org/2000/svg'
						className='h-3 w-3 mr-1'
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
					Private
				</div>
			)}
			{profile.name && <p className='text-lg font-semibold mt-2'>{profile.name}</p>}
			<p className='text-xl font-bold mt-1'>@{profile.username}</p>
			{profile.bio && <p className='mt-2 text-center'>{profile.bio}</p>}
			<div className='flex space-x-6 mt-3'>
				<div className='text-center'>
					<p className=' font-semibold'>{profile.circlesCount}</p>
					<p className='text-sm'>circles</p>
				</div>
				<div className='text-center'>
					<p className=' font-semibold'>{profile.albumsCount}</p>
					<p className='text-sm'>albums</p>
				</div>
				<Link
					href={`/${profile.username}/followers`}
					className='text-center'
				>
					<p className=' font-semibold'>{followersCount}</p>
					<p className='text-sm'>followers</p>
				</Link>
				<Link
					href={`/${profile.username}/following`}
					className='text-center'
				>
					<p className=' font-semibold'>{followingCount}</p>
					<p className='text-sm'>following</p>
				</Link>
			</div>
			{profile.isOwnProfile && (
				<Link
					href='/settings'
					className='absolute right-4 top-4'
				>
					<Settings className='w-6 h-6 ' />
				</Link>
			)}
			<div className='mt-4'>
				{profile.isOwnProfile ? (
					<Link href='/profile/edit-profile'>
						<button className='px-6 py-2 bg-[var(--primary)] text-white hover:opacity-90 font-medium rounded-md transition'>Edit Profile</button>
					</Link>
				) : (
					<div className='flex gap-3'>
						<button
							className={`px-6 py-2 rounded-lg hover:opacity-70 hover:cursor-pointer transition ${showUnfollowConfirm ? 'bg-red-500 text-white' : isFollowing ? 'bg-[var(--background-secondary)] border border-[var(--border)]' : requestSent ? 'bg-gray-400 text-white' : 'bg-[var(--primary)] text-white'}`}
							onClick={handleFollowAction}
							disabled={requestSent || isProcessing}
						>
							{showUnfollowConfirm ? (
								<div className='flex items-center gap-2'>
									<span>Unfollow?</span>
									<Check className='w-4 h-4' />
								</div>
							) : isFollowing ? (
								isProcessing ? (
									'Processing...'
								) : (
									'Following'
								)
							) : profile.isProfilePrivate && !isFollowing ? (
								requestSent ? (
									'Request Sent'
								) : isProcessing ? (
									'Processing...'
								) : (
									'Request to Follow'
								)
							) : isProcessing ? (
								'Processing...'
							) : (
								'Follow'
							)}
						</button>
						<button
							className='px-4 py-2 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] hover:opacity-70 hover:cursor-pointer transition flex items-center gap-2'
							onClick={handleMessageClick}
							disabled={isMessageProcessing}
						>
							<MessageCircle className='w-5 h-5' />
							<span>{isMessageProcessing ? 'Opening...' : 'Message'}</span>
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
