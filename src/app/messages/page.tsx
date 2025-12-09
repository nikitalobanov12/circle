'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/bottom_bar/NavBar';
import ConversationList from '@/components/messages/ConversationList';
import { FaEnvelope } from 'react-icons/fa';

interface Participant {
	id: number;
	name: string | null;
	username: string;
	profileImage: string | null;
}

interface LastMessage {
	id: number;
	content: string;
	createdAt: string;
	sender: {
		id: number;
		name: string | null;
		username: string;
	};
}

interface Conversation {
	id: number;
	participants: Participant[];
	lastMessage: LastMessage | null;
	unreadCount: number;
	updatedAt: string;
}

export default function MessagesPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (status === 'unauthenticated') {
			router.push('/auth/login?callbackUrl=/messages');
		}
	}, [status, router]);

	useEffect(() => {
		async function fetchConversations() {
			try {
				const response = await fetch('/api/messages/conversations');
				if (response.ok) {
					const data = await response.json();
					setConversations(data);
				}
			} catch (error) {
				console.error('Error fetching conversations:', error);
			} finally {
				setIsLoading(false);
			}
		}

		if (status === 'authenticated') {
			fetchConversations();
		}
	}, [status]);

	if (status === 'loading' || isLoading) {
		return (
			<>
				<main className='w-full max-w-xl mx-auto min-h-screen bg-background flex flex-col pb-20'>
					<header className='flex items-center gap-3 p-4 border-b border-border sticky top-0 bg-background z-10'>
						<FaEnvelope className='w-6 h-6 text-primary' />
						<h1 className='text-xl font-bold'>Messages</h1>
					</header>
					<div className='flex-1 flex items-center justify-center'>
						<div className='animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full' />
					</div>
				</main>
				<NavBar />
			</>
		);
	}

	const currentUserId = session?.user?.id ? parseInt(session.user.id) : 0;

	return (
		<>
			<main className='w-full max-w-xl mx-auto min-h-screen bg-background flex flex-col pb-20'>
				<header className='flex items-center gap-3 p-4 border-b border-border sticky top-0 bg-background z-10'>
					<FaEnvelope className='w-6 h-6 text-primary' />
					<h1 className='text-xl font-bold'>Messages</h1>
				</header>
				<div className='flex-1'>
					<ConversationList
						conversations={conversations}
						currentUserId={currentUserId}
					/>
				</div>
			</main>
			<NavBar />
		</>
	);
}
