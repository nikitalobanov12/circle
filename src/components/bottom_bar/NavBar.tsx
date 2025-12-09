'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaSearch, FaPlusCircle, FaBell, FaUser, FaSignInAlt, FaEnvelope } from 'react-icons/fa';
import { useState, useEffect, useMemo } from 'react';
import CreateContainer from '../create/create_container';
import { useSession } from 'next-auth/react';
import { useGuest } from '@/components/providers/GuestProvider';

export default function NavBar() {
	const pathname = usePathname();
	const { data: session, status } = useSession({ required: false });
	const { promptSignUp } = useGuest();
	const [createVisibility, setCreateVisibility] = useState(false);
	
	const isAuthenticated = status === 'authenticated' && !!session?.user;
	const isGuest = !isAuthenticated;

	// Base nav items for authenticated users
	const [navItems, setNavItems] = useState([
		{ name: 'Home', path: '/home', icon: FaHome, requiresAuth: false },
		{ name: 'Search', path: '/search', icon: FaSearch, requiresAuth: false },
		{ name: 'New', path: '/new', icon: FaPlusCircle, requiresAuth: true },
		{ name: 'Messages', path: '/messages', icon: FaEnvelope, requiresAuth: true },
		{ name: 'Profile', path: '/profile', icon: FaUser, requiresAuth: true },
	]);

	// Guest nav items
	const guestNavItems = useMemo(() => [
		{ name: 'Browse', path: '/guest/browse', icon: FaHome, requiresAuth: false },
		{ name: 'Search', path: '/search', icon: FaSearch, requiresAuth: false },
		{ name: 'Sign In', path: '/auth/login', icon: FaSignInAlt, requiresAuth: false },
	], []);

	useEffect(() => {
		interface ExtendedUser {
			username?: string;
		}
		const user = session?.user as ExtendedUser | undefined;
		if (user?.username) {
			setNavItems(prev => prev.map(item => (item.name === 'Profile' ? { ...item, path: `/${user.username}` } : item)));
		}
	}, [session]);

	const toggleCreateContainer = () => {
		if (isGuest) {
			promptSignUp('create content');
			return;
		}
		setCreateVisibility(() => !createVisibility);
	};

	const handleGuestClick = (e: React.MouseEvent, item: typeof navItems[0]) => {
		if (isGuest && item.requiresAuth) {
			e.preventDefault();
			promptSignUp(item.name.toLowerCase());
		}
	};

	const activeNavItems = isGuest ? guestNavItems : navItems;

	return (
		<>
			<nav className='fixed bottom-0 left-0 right-0 z-50 bg-[var(--background)] flex justify-center '>
				<div className='w-full max-w-xl p-2 flex justify-between border-t border-border/40'>
					{activeNavItems.map(item => {
						const isProfileItem = item.name === 'Profile';
						const isMessagesItem = item.name === 'Messages';
						const isActive = isProfileItem 
							? pathname === item.path || (pathname.startsWith('/profile/') && item.path === '/profile') 
							: isMessagesItem
							? pathname === item.path || pathname.startsWith('/messages/')
							: pathname === item.path || (item.name === 'Browse' && pathname === '/guest/browse');

						if (item.name === 'New' && !isGuest) {
							return (
								<div
									key={item.name}
									className={`flex flex-col items-center flex-1 py-2  cursor-pointer rounded-md 
                                    ${isActive ? 'text-[var(--primary)] font-medium' : 'text-[var(--foreground)] opacity-70'} 
                                    hover:bg-[var(--foreground)]/5 hover:text-[var(--primary)]`}
									onClick={toggleCreateContainer}
								>
									<item.icon className={`h-6 w-6 mb-1 ${isActive ? 'scale-110' : ''}`} />
									<span className='text-xs'>{item.name}</span>
								</div>
							);
						}

						return (
							<Link
								key={item.name}
								href={item.path}
								onClick={(e) => handleGuestClick(e, item)}
								className={`flex flex-col items-center flex-1 py-2 rounded-md transition-all duration-200 
                                ${isActive ? 'text-[var(--primary)] font-medium' : 'text-[var(--foreground)] opacity-70'} 
                                hover:bg-[var(--foreground)]/5 hover:text-[var(--primary)]`}
							>
								<item.icon className={`h-6 w-6 mb-1 ${isActive ? 'scale-110' : ''} transition-transform duration-200`} />
								<span className='text-xs'>{item.name}</span>
							</Link>
						);
					})}
				</div>
			</nav>
			{!isGuest && (
				<CreateContainer
					isVisible={createVisibility}
					onClose={() => setCreateVisibility(false)}
				/>
			)}
		</>
	);
}
