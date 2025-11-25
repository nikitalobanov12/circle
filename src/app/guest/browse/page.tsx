import prisma from '@/lib/prisma';
import Link from 'next/link';
import CircleHolder from '@/components/circle_holders';
import AlbumCard from '@/components/album/AlbumCard';
import AlbumGrid from '@/components/album/AlbumGrid';
import NavBar from '@/components/bottom_bar/NavBar';
import CirclesLogo from '@/components/Circles_Logo';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function GuestBrowsePage() {
	// If user is logged in, redirect to their home feed
	const session = await auth();
	if (session?.user) {
		redirect('/home');
	}

	// Fetch public circles
	const publicCircles = await prisma.circle.findMany({
		where: {
			isPrivate: false,
		},
		select: {
			id: true,
			name: true,
			description: true,
			avatar: true,
			_count: {
				select: {
					members: true,
					Album: true,
				},
			},
		},
		orderBy: {
			members: {
				_count: 'desc',
			},
		},
		take: 10,
	});

	// Fetch public albums
	const publicAlbums = await prisma.album.findMany({
		where: {
			isPrivate: false,
			OR: [
				{ circleId: null },
				{
					Circle: {
						isPrivate: false,
					},
				},
			],
		},
		include: {
			creator: true,
			Circle: {
				select: {
					id: true,
					name: true,
					avatar: true,
				},
			},
			_count: {
				select: {
					Photo: true,
				},
			},
		},
		orderBy: {
			createdAt: 'desc',
		},
		take: 20,
	});

	return (
		<>
			<main className='w-full max-w-xl mx-auto min-h-screen bg-background flex flex-col px-2 pb-24'>
				{/* Header */}
				<header className='flex justify-between items-center py-4 sticky top-0 bg-background z-10'>
					<div className='flex items-center gap-2'>
						<CirclesLogo width={32} height={32} showText={false} />
						<span className='text-lg font-semibold italic'>CIRCLES.</span>
					</div>
					<div className='flex items-center gap-3'>
						<Link
							href='/auth/login'
							className='text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity'
						>
							Sign In
						</Link>
					</div>
				</header>

				{/* Guest Banner */}
				<div className='bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6'>
					<p className='text-sm text-center'>
						You&apos;re browsing as a guest.{' '}
						<Link href='/auth/register' className='text-primary font-medium hover:underline'>
							Sign up
						</Link>{' '}
						to create circles, share photos, and connect with friends.
					</p>
				</div>

				{/* Public Circles Section */}
				<section className='w-full mb-8'>
					<div className='flex justify-between items-center mb-4'>
						<h2 className='text-lg font-bold'>Popular Circles</h2>
						<Link href='/search' className='text-sm text-primary hover:underline'>
							See all
						</Link>
					</div>

					{publicCircles.length > 0 ? (
						<div className='flex flex-row gap-4 overflow-x-auto pb-2'>
							{publicCircles.map(circle => (
								<div key={circle.id} className='flex-shrink-0'>
									<Link href={`/circle/${circle.id}`}>
										<CircleHolder
											imageSrc={circle.avatar || '/images/circles/default.svg'}
											name={circle.name}
											circleSize={80}
										/>
									</Link>
									<p className='text-xs text-center text-foreground-secondary mt-1'>
										{circle._count.members} {circle._count.members === 1 ? 'member' : 'members'}
									</p>
								</div>
							))}
						</div>
					) : (
						<div className='py-6 text-center bg-background-secondary rounded-lg'>
							<p className='text-foreground-secondary'>No public circles yet</p>
						</div>
					)}
				</section>

				{/* Public Albums Section */}
				<section className='w-full mb-8'>
					<div className='flex justify-between items-center mb-4'>
						<h2 className='text-lg font-bold'>Recent Albums</h2>
					</div>

					{publicAlbums.length > 0 ? (
						<AlbumGrid albumIds={publicAlbums.map(album => album.id)}>
							{publicAlbums.map(album => (
								<AlbumCard
									key={album.id}
									albumId={album.id}
									albumImage={album.coverImage || '/images/albums/default.svg'}
									albumName={album.title}
									userProfileImage={album.creator?.profileImage || '/images/default-avatar.png'}
									photoCount={album._count.Photo}
									creatorName={album.creator?.name || album.creator?.username || 'Unknown'}
									circleName={album.Circle?.name}
									circleImage={album.Circle?.avatar || '/images/circles/default.svg'}
									sourceName={album.Circle ? album.Circle.name : album.creator?.name || 'Unknown'}
									sourceType={album.Circle ? 'circle' : 'user'}
								/>
							))}
						</AlbumGrid>
					) : (
						<div className='py-12 text-center bg-background-secondary rounded-lg'>
							<p className='text-foreground-secondary mb-4'>No public albums to show yet</p>
							<p className='text-sm text-foreground-secondary'>
								Be the first to share!{' '}
								<Link href='/auth/register' className='text-primary hover:underline'>
									Create an account
								</Link>
							</p>
						</div>
					)}
				</section>

				{/* CTA Section */}
				<section className='py-8 px-4 bg-background-secondary rounded-xl text-center mb-8'>
					<h3 className='text-xl font-bold mb-2'>Ready to Join?</h3>
					<p className='text-foreground-secondary mb-4'>
						Create your own circles and start sharing memories with your friends.
					</p>
					<Link
						href='/auth/register'
						className='inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity'
					>
						Get Started Free
					</Link>
				</section>
			</main>
			<NavBar />
		</>
	);
}
