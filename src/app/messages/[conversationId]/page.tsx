'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ChatView from '@/components/messages/ChatView';

interface Participant {
	id: number;
	name: string | null;
	username: string;
	profileImage: string | null;
}

interface ConversationPageProps {
	params: Promise<{ conversationId: string }>;
}

export default function ConversationPage({ params }: ConversationPageProps) {
	const { conversationId } = use(params);
	const { status } = useSession();
	const router = useRouter();
	const [participants, setParticipants] = useState<Participant[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const conversationIdNum = parseInt(conversationId);

	useEffect(() => {
		if (status === 'unauthenticated') {
			router.push(`/auth/login?callbackUrl=/messages/${conversationId}`);
		}
	}, [status, router, conversationId]);

	useEffect(() => {
		async function fetchConversation() {
			try {
				// Fetch conversation details to get participants
				const response = await fetch('/api/messages/conversations');
				if (response.ok) {
					const conversations = await response.json();
					const conversation = conversations.find((c: { id: number }) => c.id === conversationIdNum);
					
					if (conversation) {
						setParticipants(conversation.participants);
					} else {
						setError('Conversation not found');
					}
				} else {
					setError('Failed to load conversation');
				}
			} catch (err) {
				console.error('Error fetching conversation:', err);
				setError('Failed to load conversation');
			} finally {
				setIsLoading(false);
			}
		}

		if (status === 'authenticated') {
			fetchConversation();
		}
	}, [status, conversationIdNum]);

	if (status === 'loading' || isLoading) {
		return (
			<div className='w-full max-w-xl mx-auto h-screen bg-background flex items-center justify-center'>
				<div className='animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full' />
			</div>
		);
	}

	if (error) {
		return (
			<div className='w-full max-w-xl mx-auto h-screen bg-background flex flex-col items-center justify-center gap-4'>
				<p className='text-foreground-secondary'>{error}</p>
				<button
					onClick={() => router.push('/messages')}
					className='px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity'
				>
					Back to Messages
				</button>
			</div>
		);
	}

	return (
		<div className='w-full max-w-xl mx-auto h-screen bg-background'>
			<ChatView
				conversationId={conversationIdNum}
				participants={participants}
			/>
		</div>
	);
}
