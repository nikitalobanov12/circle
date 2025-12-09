'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { usePusher } from '@/components/providers/PusherProvider';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import CircleHolder from '@/components/circle_holders';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

interface Message {
	id: number;
	content: string;
	createdAt: string;
	senderId: number;
	conversationId: number;
	sender: {
		id: number;
		name: string | null;
		username: string;
		profileImage: string | null;
	};
}

interface Participant {
	id: number;
	name: string | null;
	username: string;
	profileImage: string | null;
}

interface ChatViewProps {
	conversationId: number;
	participants: Participant[];
}

export default function ChatView({ conversationId, participants }: ChatViewProps) {
	const { data: session } = useSession();
	const { subscribeToConversation, unsubscribeFromConversation, onNewMessage, onTyping } = usePusher();
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSending, setIsSending] = useState(false);
	const [typingUsers, setTypingUsers] = useState<Map<number, { name: string; timeout: NodeJS.Timeout }>>(new Map());
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const messagesContainerRef = useRef<HTMLDivElement>(null);

	const currentUserId = session?.user?.id ? parseInt(session.user.id) : null;
	const otherUser = participants[0];

	// Scroll to bottom
	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, []);

	// Fetch messages
	useEffect(() => {
		async function fetchMessages() {
			try {
				const response = await fetch(`/api/messages/${conversationId}`);
				if (response.ok) {
					const data = await response.json();
					setMessages(data.messages);
					setTimeout(scrollToBottom, 100);
				}
			} catch (error) {
				console.error('Error fetching messages:', error);
			} finally {
				setIsLoading(false);
			}
		}

		fetchMessages();
	}, [conversationId, scrollToBottom]);

	// Subscribe to real-time updates
	useEffect(() => {
		subscribeToConversation(conversationId);

		return () => {
			unsubscribeFromConversation(conversationId);
		};
	}, [conversationId, subscribeToConversation, unsubscribeFromConversation]);

	// Handle new messages
	useEffect(() => {
		const unsubscribe = onNewMessage((message: Message) => {
			if (message.conversationId === conversationId) {
				setMessages(prev => {
					// Avoid duplicates
					if (prev.some(m => m.id === message.id)) {
						return prev;
					}
					return [...prev, message];
				});
				scrollToBottom();

				// Mark as read if the message is from another user
				if (message.senderId !== currentUserId) {
					fetch(`/api/messages/${conversationId}/read`, { method: 'POST' });
				}
			}
		});

		return unsubscribe;
	}, [conversationId, currentUserId, onNewMessage, scrollToBottom]);

	// Handle typing indicators
	useEffect(() => {
		const unsubscribe = onTyping((data) => {
			if (data.user.id === currentUserId) return;

			setTypingUsers(prev => {
				const next = new Map(prev);
				
				if (data.isTyping) {
					// Clear existing timeout
					const existing = next.get(data.user.id);
					if (existing?.timeout) {
						clearTimeout(existing.timeout);
					}
					
					// Set new timeout to clear typing indicator
					const timeout = setTimeout(() => {
						setTypingUsers(p => {
							const n = new Map(p);
							n.delete(data.user.id);
							return n;
						});
					}, 3000);
					
					next.set(data.user.id, { name: data.user.name || data.user.username, timeout });
				} else {
					const existing = next.get(data.user.id);
					if (existing?.timeout) {
						clearTimeout(existing.timeout);
					}
					next.delete(data.user.id);
				}
				
				return next;
			});
		});

		return unsubscribe;
	}, [currentUserId, onTyping]);

	// Send message
	const handleSendMessage = async (content: string) => {
		if (!content.trim() || isSending) return;

		setIsSending(true);
		try {
			const response = await fetch(`/api/messages/${conversationId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content }),
			});

			if (response.ok) {
				const message = await response.json();
				setMessages(prev => {
					if (prev.some(m => m.id === message.id)) {
						return prev;
					}
					return [...prev, message];
				});
				scrollToBottom();
			}
		} catch (error) {
			console.error('Error sending message:', error);
		} finally {
			setIsSending(false);
		}
	};

	// Send typing indicator
	const handleTyping = useCallback(async (isTyping: boolean) => {
		try {
			await fetch(`/api/messages/${conversationId}/typing`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isTyping }),
			});
		} catch (error) {
			// Silently fail for typing indicators
		}
	}, [conversationId]);

	const typingUserNames = Array.from(typingUsers.values()).map(u => u.name);

	return (
		<div className='flex flex-col h-full'>
			{/* Header */}
			<div className='flex items-center gap-3 p-4 border-b border-border bg-background'>
				<Link href='/messages' className='p-2 -ml-2 hover:bg-background-secondary rounded-full transition-colors'>
					<FaArrowLeft className='w-5 h-5' />
				</Link>
				<Link href={`/${otherUser?.username}`} className='flex items-center gap-3 flex-1'>
					<CircleHolder
						imageSrc={otherUser?.profileImage || '/images/default-avatar.png'}
						circleSize={40}
						showName={false}
					/>
					<div>
						<h2 className='font-semibold'>{otherUser?.name || otherUser?.username}</h2>
						<p className='text-xs text-foreground-secondary'>@{otherUser?.username}</p>
					</div>
				</Link>
			</div>

			{/* Messages */}
			<div ref={messagesContainerRef} className='flex-1 overflow-y-auto p-4 space-y-4'>
				{isLoading ? (
					<div className='flex items-center justify-center h-full'>
						<div className='animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full' />
					</div>
				) : messages.length === 0 ? (
					<div className='flex flex-col items-center justify-center h-full text-center'>
						<CircleHolder
							imageSrc={otherUser?.profileImage || '/images/default-avatar.png'}
							circleSize={80}
							showName={false}
						/>
						<h3 className='font-semibold mt-4'>{otherUser?.name || otherUser?.username}</h3>
						<p className='text-foreground-secondary text-sm mt-1'>
							This is the beginning of your conversation
						</p>
					</div>
				) : (
					<>
						{messages.map((message, index) => {
							const isOwn = message.senderId === currentUserId;
							const showAvatar = !isOwn && (index === 0 || messages[index - 1].senderId !== message.senderId);
							
							return (
								<MessageBubble
									key={message.id}
									message={message}
									isOwn={isOwn}
									showAvatar={showAvatar}
								/>
							);
						})}
						<div ref={messagesEndRef} />
					</>
				)}
				
				{typingUserNames.length > 0 && (
					<TypingIndicator userNames={typingUserNames} />
				)}
			</div>

			{/* Input */}
			<MessageInput
				onSend={handleSendMessage}
				onTyping={handleTyping}
				disabled={isSending}
			/>
		</div>
	);
}
