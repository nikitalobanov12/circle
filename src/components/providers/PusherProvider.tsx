'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getPusherClient } from '@/lib/pusher-client';
import type { Channel } from 'pusher-js';

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

interface TypingUser {
	id: number;
	name: string | null;
	username: string;
}

interface PusherContextType {
	subscribeToConversation: (conversationId: number) => void;
	unsubscribeFromConversation: (conversationId: number) => void;
	onNewMessage: (callback: (message: Message) => void) => () => void;
	onTyping: (callback: (data: { user: TypingUser; isTyping: boolean }) => void) => () => void;
	onMessagesRead: (callback: (data: { userId: number; readAt: string }) => void) => () => void;
	unreadCount: number;
	isConnected: boolean;
}

const PusherContext = createContext<PusherContextType | undefined>(undefined);

export function usePusher() {
	const context = useContext(PusherContext);
	if (!context) {
		throw new Error('usePusher must be used within a PusherProvider');
	}
	return context;
}

interface PusherProviderProps {
	children: ReactNode;
}

export function PusherProvider({ children }: PusherProviderProps) {
	const { data: session, status } = useSession();
	const [isConnected, setIsConnected] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);
	const [userChannel, setUserChannel] = useState<Channel | null>(null);
	const [conversationChannels, setConversationChannels] = useState<Map<number, Channel>>(new Map());
	const [messageCallbacks, setMessageCallbacks] = useState<Set<(message: Message) => void>>(new Set());
	const [typingCallbacks, setTypingCallbacks] = useState<Set<(data: { user: TypingUser; isTyping: boolean }) => void>>(new Set());
	const [readCallbacks, setReadCallbacks] = useState<Set<(data: { userId: number; readAt: string }) => void>>(new Set());

	// Initialize Pusher connection when authenticated
	useEffect(() => {
		if (status !== 'authenticated' || !session?.user?.id) {
			return;
		}

		const pusher = getPusherClient();
		const userId = session.user.id;

		// Subscribe to user's personal channel for notifications
		const channel = pusher.subscribe(`user-${userId}`);
		setUserChannel(channel);

		channel.bind('pusher:subscription_succeeded', () => {
			setIsConnected(true);
		});

		// Listen for new message notifications (for unread badge)
		channel.bind('new-message-notification', (data: { conversationId: number; message: Message }) => {
			setUnreadCount(prev => prev + 1);
			// Notify all message callbacks
			messageCallbacks.forEach(cb => cb(data.message));
		});

		return () => {
			pusher.unsubscribe(`user-${userId}`);
			setUserChannel(null);
			setIsConnected(false);
		};
	}, [status, session?.user?.id, messageCallbacks]);

	// Subscribe to a conversation channel
	const subscribeToConversation = useCallback((conversationId: number) => {
		if (conversationChannels.has(conversationId)) {
			return;
		}

		const pusher = getPusherClient();
		const channel = pusher.subscribe(`conversation-${conversationId}`);

		channel.bind('new-message', (data: { message: Message }) => {
			messageCallbacks.forEach(cb => cb(data.message));
		});

		channel.bind('typing', (data: { user: TypingUser; isTyping: boolean }) => {
			typingCallbacks.forEach(cb => cb(data));
		});

		channel.bind('messages-read', (data: { userId: number; readAt: string }) => {
			readCallbacks.forEach(cb => cb(data));
		});

		setConversationChannels(prev => new Map(prev).set(conversationId, channel));
	}, [conversationChannels, messageCallbacks, typingCallbacks, readCallbacks]);

	// Unsubscribe from a conversation channel
	const unsubscribeFromConversation = useCallback((conversationId: number) => {
		const channel = conversationChannels.get(conversationId);
		if (channel) {
			const pusher = getPusherClient();
			pusher.unsubscribe(`conversation-${conversationId}`);
			setConversationChannels(prev => {
				const next = new Map(prev);
				next.delete(conversationId);
				return next;
			});
		}
	}, [conversationChannels]);

	// Register callback for new messages
	const onNewMessage = useCallback((callback: (message: Message) => void) => {
		setMessageCallbacks(prev => new Set(prev).add(callback));
		return () => {
			setMessageCallbacks(prev => {
				const next = new Set(prev);
				next.delete(callback);
				return next;
			});
		};
	}, []);

	// Register callback for typing indicators
	const onTyping = useCallback((callback: (data: { user: TypingUser; isTyping: boolean }) => void) => {
		setTypingCallbacks(prev => new Set(prev).add(callback));
		return () => {
			setTypingCallbacks(prev => {
				const next = new Set(prev);
				next.delete(callback);
				return next;
			});
		};
	}, []);

	// Register callback for read receipts
	const onMessagesRead = useCallback((callback: (data: { userId: number; readAt: string }) => void) => {
		setReadCallbacks(prev => new Set(prev).add(callback));
		return () => {
			setReadCallbacks(prev => {
				const next = new Set(prev);
				next.delete(callback);
				return next;
			});
		};
	}, []);

	const value = {
		subscribeToConversation,
		unsubscribeFromConversation,
		onNewMessage,
		onTyping,
		onMessagesRead,
		unreadCount,
		isConnected,
	};

	return <PusherContext.Provider value={value}>{children}</PusherContext.Provider>;
}
