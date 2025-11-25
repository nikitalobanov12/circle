'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import FriendRequests from '@/components/activity/FriendRequests';
import NavBar from '@/components/bottom_bar/NavBar';

export default function FriendRequestsPage() {
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Simple loading simulation (could be removed in production)
		const timer = setTimeout(() => {
			setLoading(false);
		}, 500);

		return () => clearTimeout(timer);
	}, []);

	return (
		<>
			<div className='min-h-screen bg-[var(--background)]'>
				<div className='w-full max-w-xl mx-auto p-4 pb-20'>
					<div className='flex items-center mb-6'>
						<Link
							href='/activity'
							className='mr-4'
						>
							<ArrowLeft className='w-6 h-6' />
						</Link>
						<h1 className='text-2xl font-bold'>Follow Requests</h1>
					</div>

					<div className='mb-4'>
						<p className='text-sm opacity-70'>People who want to follow you. Accept to let them see your private content.</p>
					</div>

					{loading ? (
						<div className='flex justify-center py-10'>
							<div className='animate-pulse'>Loading...</div>
						</div>
					) : (
						<FriendRequests />
					)}
				</div>
			</div>
			<NavBar />
		</>
	);
}
