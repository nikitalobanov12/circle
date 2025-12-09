'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { usePusher } from '@/components/providers/PusherProvider';
import MessageBubble, { MessageStatus } from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import CircleHolder from '@/components/circle_holders';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

interface Message {
	id: number | string;
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
	status?: MessageStatus;
	tempId?: string;
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

	// Send message with optimistic update
	const handleSendMessage = async (content: string) => {
		if (!content.trim() || !currentUserId || !session?.user) return;

		const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		
		// Create optimistic message
		const optimisticMessage: Message = {
			id: tempId,
			tempId,
			content: content.trim(),
			createdAt: new Date().toISOString(),
			senderId: currentUserId,
			conversationId,
			sender: {
				id: currentUserId,
				name: session.user.name || null,
				username: (session.user as { username?: string }).username || session.user.email?.split('@')[0] || 'user',
				profileImage: session.user.image || null,
			},
			status: 'sending',
		};

		// Add optimistic message immediately
		setMessages(prev => [...prev, optimisticMessage]);
		scrollToBottom();

		try {
			const response = await fetch(`/api/messages/${conversationId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content }),
			});

			if (response.ok) {
				const serverMessage = await response.json();
				// Replace optimistic message with server response
				setMessages(prev => prev.map(m => 
					m.tempId === tempId 
						? { ...serverMessage, status: 'sent' as MessageStatus }
						: m
				));
			} else {
				throw new Error('Failed to send message');
			}
		} catch (error) {
			console.error('Error sending message:', error);
			// Mark message as failed
			setMessages(prev => prev.map(m => 
				m.tempId === tempId 
					? { ...m, status: 'failed' as MessageStatus }
					: m
			));
		}
	};

	// Retry failed message
	const handleRetry = useCallback(async (failedMessage: Message) => {
		if (!failedMessage.tempId) return;

		// Update status to sending
		setMessages(prev => prev.map(m => 
			m.tempId === failedMessage.tempId 
				? { ...m, status: 'sending' as MessageStatus }
				: m
		));

		try {
			const response = await fetch(`/api/messages/${conversationId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: failedMessage.content }),
			});

			if (response.ok) {
				const serverMessage = await response.json();
				// Replace optimistic message with server response
				setMessages(prev => prev.map(m => 
					m.tempId === failedMessage.tempId 
						? { ...serverMessage, status: 'sent' as MessageStatus }
						: m
				));
			} else {
				throw new Error('Failed to send message');
			}
		} catch (error) {
			console.error('Error retrying message:', error);
			// Mark message as failed again
			setMessages(prev => prev.map(m => 
				m.tempId === failedMessage.tempId 
					? { ...m, status: 'failed' as MessageStatus }
					: m
			));
		}
	}, [conversationId]);

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

	// Group messages to determine spacing
	const getMessageSpacing = (index: number) => {
		if (index === 0) return 'mt-0';
		const prevMessage = messages[index - 1];
		const currentMessage = messages[index];
		// Tighter spacing for consecutive messages from the same sender
		if (prevMessage.senderId === currentMessage.senderId) {
			return 'mt-1';
		}
		return 'mt-4';
	};

	return (
		<div className='flex flex-col h-full bg-[var(--background)]'>
			{/* Header */}
			<div className='flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--background)] shadow-sm'>
				<Link href='/messages' className='p-2 -ml-2 hover:bg-[var(--background-secondary)] rounded-full transition-colors'>
					<FaArrowLeft className='w-5 h-5 text-[var(--foreground)]' />
				</Link>
				<Link href={`/${otherUser?.username}`} className='flex items-center gap-3 flex-1'>
					<div className='relative'>
						<CircleHolder
							imageSrc={otherUser?.profileImage || '/images/default-avatar.png'}
							circleSize={44}
							showName={false}
						/>
						{/* Online indicator - can be made dynamic later */}
						<div className='absolute bottom-0 right-0 w-3 h-3 bg-[var(--groovy-green)] border-2 border-[var(--background)] rounded-full' />
					</div>
					<div>
						<h2 className='font-semibold text-[var(--foreground)]'>{otherUser?.name || otherUser?.username}</h2>
						<p className='text-xs text-[var(--foreground-secondary)]'>@{otherUser?.username}</p>
					</div>
				</Link>
			</div>

			{/* Messages */}
			<div ref={messagesContainerRef} className='flex-1 overflow-y-auto px-4 py-4'>
				{isLoading ? (
					<div className='flex items-center justify-center h-full'>
						<div className='animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full' />
					</div>
				) : messages.length === 0 ? (
					<div className='flex flex-col items-center justify-center h-full text-center px-8'>
						<div className='relative'>
							<CircleHolder
								imageSrc={otherUser?.profileImage || '/images/default-avatar.png'}
								circleSize={88}
								showName={false}
							/>
						</div>
						<h3 className='font-semibold text-lg mt-4 text-[var(--foreground)]'>{otherUser?.name || otherUser?.username}</h3>
						<p className='text-[var(--foreground-secondary)] text-sm mt-1'>
							Start a conversation with {otherUser?.name || otherUser?.username}
						</p>
						<p className='text-[var(--foreground-secondary)] text-xs mt-1 opacity-60'>
							Messages are private between you two
						</p>
					</div>
				) : (
					<>
						{messages.map((message, index) => {
							const isOwn = message.senderId === currentUserId;
							const showAvatar = !isOwn && (index === 0 || messages[index - 1].senderId !== message.senderId);
							
							return (
								<div key={message.id} className={getMessageSpacing(index)}>
									<MessageBubble
										message={message}
										isOwn={isOwn}
										showAvatar={showAvatar}
										onRetry={isOwn ? handleRetry : undefined}
									/>
								</div>
							);
						})}
						<div ref={messagesEndRef} />
					</>
				)}
				
				{typingUserNames.length > 0 && (
					<div className='mt-2'>
						<TypingIndicator userNames={typingUserNames} />
					</div>
				)}
			</div>

			{/* Input */}
			<MessageInput
				onSend={handleSendMessage}
				onTyping={handleTyping}
			/>
		</div>
	);
}
