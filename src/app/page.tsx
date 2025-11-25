import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CirclesLogo from '@/components/Circles_Logo';
import { FaUsers, FaImages, FaLock, FaHeart, FaArrowRight } from 'react-icons/fa';

export default async function LandingPage() {
	const session = await auth();

	// If user is already logged in, redirect to their feed
	if (session?.user) {
		redirect('/home');
	}

	return (
		<div className='min-h-screen bg-[var(--circles-dark)] text-[var(--circles-light)] overflow-x-hidden'>
			{/* Header */}
			<header className='w-full py-4 px-6 flex justify-between items-center max-w-6xl mx-auto'>
				<div className='flex items-center gap-2'>
					<CirclesLogo width={36} height={36} showText={false} white />
					<span className='text-xl font-bold italic tracking-tight'>CIRCLES.</span>
				</div>
				<div className='flex items-center gap-3'>
					<Link
						href='/auth/login'
						className='text-sm font-medium hover:text-[var(--circles-light-blue)] transition-colors hidden sm:block'
					>
						Sign In
					</Link>
					<Link
						href='/auth/register'
						className='text-sm font-semibold bg-[var(--circles-light-blue)] text-[var(--circles-dark)] px-5 py-2.5 rounded-full hover:bg-white transition-colors'
					>
						Get Started
					</Link>
				</div>
			</header>

			{/* Hero Section */}
			<section className='relative px-6 pt-16 pb-24 md:pt-24 md:pb-32'>
				{/* Background gradient effect */}
				<div className='absolute inset-0 overflow-hidden'>
					<div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--circles-dark-blue)] rounded-full opacity-20 blur-[120px]' />
					<div className='absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-[var(--circles-light-blue)] rounded-full opacity-10 blur-[100px]' />
				</div>

				<div className='relative max-w-4xl mx-auto text-center'>
					<div className='inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8'>
						<span className='w-2 h-2 bg-[var(--groovy-green)] rounded-full animate-pulse' />
						<span className='text-sm font-medium'>Share memories with your inner circle</span>
					</div>

					<h1 className='text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight'>
						Your Moments,
						<br />
						<span className='bg-gradient-to-r from-[var(--circles-light-blue)] to-[var(--circles-light)] bg-clip-text text-transparent'>
							Your Circle
						</span>
					</h1>

					<p className='text-lg md:text-xl text-[var(--circles-light)]/70 mb-10 max-w-2xl mx-auto leading-relaxed'>
						Create private groups, share photo albums, and keep memories alive with the people who matter most. 
						Think Google Drive meets Instagram, but just for your friends.
					</p>

					<div className='flex flex-col sm:flex-row gap-4 justify-center'>
						<Link
							href='/auth/register'
							className='group inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--circles-light)] text-[var(--circles-dark)] rounded-full font-semibold text-lg hover:bg-white transition-all hover:scale-105'
						>
							Create Your Circle
							<FaArrowRight className='group-hover:translate-x-1 transition-transform' />
						</Link>
						<Link
							href='/guest/browse'
							className='inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full font-semibold text-lg hover:bg-white/20 transition-all'
						>
							Browse as Guest
						</Link>
					</div>

					{/* Stats */}
					<div className='flex flex-wrap justify-center gap-8 md:gap-16 mt-16 pt-16 border-t border-white/10'>
						<StatItem value='100%' label='Free to use' />
						<StatItem value='Private' label='By default' />
						<StatItem value='Unlimited' label='Photo sharing' />
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className='py-24 px-6 bg-gradient-to-b from-transparent to-[var(--circles-dark-blue)]/20'>
				<div className='max-w-6xl mx-auto'>
					<div className='text-center mb-16'>
						<h2 className='text-3xl md:text-5xl font-bold mb-4'>
							Everything your group needs
						</h2>
						<p className='text-lg text-[var(--circles-light)]/60 max-w-2xl mx-auto'>
							Simple, powerful features designed for sharing memories with your closest people.
						</p>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<FeatureCard
							icon={<FaUsers className='w-7 h-7' />}
							title='Private Circles'
							description='Create invite-only groups for friends, family, or teams. Your memories stay between you and your people.'
							gradient='from-blue-500/20 to-purple-500/20'
						/>
						<FeatureCard
							icon={<FaImages className='w-7 h-7' />}
							title='Shared Albums'
							description='Everyone can contribute photos to shared albums. Perfect for trips, events, or everyday moments together.'
							gradient='from-green-500/20 to-teal-500/20'
						/>
						<FeatureCard
							icon={<FaLock className='w-7 h-7' />}
							title='Total Privacy Control'
							description='You decide who sees what. Keep albums private to your circle, or share select ones with the world.'
							gradient='from-orange-500/20 to-red-500/20'
						/>
						<FeatureCard
							icon={<FaHeart className='w-7 h-7' />}
							title='Stay Connected'
							description='Like, comment, and engage with content from your circles. Never miss a moment from your people.'
							gradient='from-pink-500/20 to-rose-500/20'
						/>
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section className='py-24 px-6'>
				<div className='max-w-4xl mx-auto'>
					<div className='text-center mb-16'>
						<h2 className='text-3xl md:text-5xl font-bold mb-4'>
							Get started in seconds
						</h2>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
						<StepCard number='1' title='Create your circle' description='Sign up and create a private group for your friends, family, or team.' />
						<StepCard number='2' title='Invite your people' description='Add members by username or send invite links to grow your circle.' />
						<StepCard number='3' title='Start sharing' description='Create albums, upload photos, and keep your memories in one place.' />
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className='py-24 px-6'>
				<div className='max-w-4xl mx-auto'>
					<div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--circles-dark-blue)] to-[var(--circles-light-blue)] p-12 md:p-16 text-center'>
						{/* Decorative elements */}
						<div className='absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl' />
						<div className='absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl' />

						<div className='relative'>
							<h2 className='text-3xl md:text-5xl font-bold mb-4'>
								Ready to start sharing?
							</h2>
							<p className='text-lg text-white/80 mb-8 max-w-lg mx-auto'>
								Join Circles today. It&apos;s free, private, and takes less than a minute to set up.
							</p>
							<div className='flex flex-col sm:flex-row gap-4 justify-center'>
								<Link
									href='/auth/register'
									className='inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[var(--circles-dark-blue)] rounded-full font-semibold text-lg hover:scale-105 transition-transform'
								>
									Sign Up Free
								</Link>
								<Link
									href='/auth/login'
									className='inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 backdrop-blur-sm rounded-full font-semibold text-lg hover:bg-white/30 transition-colors'
								>
									I Have an Account
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className='py-12 px-6 border-t border-white/10'>
				<div className='max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6'>
					<div className='flex items-center gap-3'>
						<CirclesLogo width={28} height={28} showText={false} white />
						<span className='text-sm text-[var(--circles-light)]/60'>
							Share moments with your people
						</span>
					</div>
					<div className='flex gap-8 text-sm text-[var(--circles-light)]/60'>
						<Link href='/guest/browse' className='hover:text-[var(--circles-light)] transition-colors'>
							Explore
						</Link>
						<Link href='/auth/login' className='hover:text-[var(--circles-light)] transition-colors'>
							Sign In
						</Link>
						<Link href='/auth/register' className='hover:text-[var(--circles-light)] transition-colors'>
							Sign Up
						</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}

function StatItem({ value, label }: { value: string; label: string }) {
	return (
		<div className='text-center'>
			<div className='text-3xl md:text-4xl font-bold text-[var(--circles-light-blue)]'>{value}</div>
			<div className='text-sm text-[var(--circles-light)]/60 mt-1'>{label}</div>
		</div>
	);
}

interface FeatureCardProps {
	icon: React.ReactNode;
	title: string;
	description: string;
	gradient: string;
}

function FeatureCard({ icon, title, description, gradient }: FeatureCardProps) {
	return (
		<div className={`group relative p-8 rounded-2xl bg-gradient-to-br ${gradient} border border-white/10 hover:border-white/20 transition-all hover:scale-[1.02]`}>
			<div className='w-14 h-14 rounded-xl bg-[var(--circles-light-blue)]/20 flex items-center justify-center text-[var(--circles-light-blue)] mb-5'>
				{icon}
			</div>
			<h3 className='text-xl font-semibold mb-3'>{title}</h3>
			<p className='text-[var(--circles-light)]/60 leading-relaxed'>{description}</p>
		</div>
	);
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
	return (
		<div className='text-center'>
			<div className='w-12 h-12 rounded-full bg-[var(--circles-light-blue)] text-[var(--circles-dark)] font-bold text-xl flex items-center justify-center mx-auto mb-4'>
				{number}
			</div>
			<h3 className='text-lg font-semibold mb-2'>{title}</h3>
			<p className='text-[var(--circles-light)]/60 text-sm'>{description}</p>
		</div>
	);
}
