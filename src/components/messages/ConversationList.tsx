'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import CircleHolder from '@/components/circle_holders';

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

interface ConversationListProps {
	conversations: Conversation[];
	currentUserId: number;
	activeConversationId?: number;
}

export default function ConversationList({ conversations, currentUserId, activeConversationId }: ConversationListProps) {
	if (conversations.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
				<div className='w-16 h-16 bg-background-secondary rounded-full flex items-center justify-center mb-4'>
					<svg className='w-8 h-8 text-foreground-secondary' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
						<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
					</svg>
				</div>
				<h3 className='font-semibold text-lg mb-2'>No messages yet</h3>
				<p className='text-foreground-secondary text-sm'>
					Start a conversation by visiting someone&apos;s profile and clicking &quot;Message&quot;
				</p>
			</div>
		);
	}

	return (
		<div className='divide-y divide-border'>
			{conversations.map(conversation => {
				const otherUser = conversation.participants[0];
				const isActive = activeConversationId === conversation.id;
				const lastMessage = conversation.lastMessage;
				const isOwnMessage = lastMessage?.sender.id === currentUserId;

				return (
					<Link
						key={conversation.id}
						href={`/messages/${conversation.id}`}
						className={`flex items-center gap-3 p-4 hover:bg-background-secondary transition-colors ${
							isActive ? 'bg-background-secondary' : ''
						}`}
					>
						<CircleHolder
							imageSrc={otherUser?.profileImage || '/images/default-avatar.png'}
							circleSize={50}
							showName={false}
						/>
						<div className='flex-1 min-w-0'>
							<div className='flex items-center justify-between gap-2'>
								<span className={`font-medium truncate ${conversation.unreadCount > 0 ? 'text-foreground' : ''}`}>
									{otherUser?.name || otherUser?.username || 'Unknown User'}
								</span>
								{lastMessage && (
									<span className='text-xs text-foreground-secondary flex-shrink-0'>
										{formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: false })}
									</span>
								)}
							</div>
							{lastMessage && (
								<p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'text-foreground font-medium' : 'text-foreground-secondary'}`}>
									{isOwnMessage && <span className='text-foreground-secondary'>You: </span>}
									{lastMessage.content}
								</p>
							)}
						</div>
						{conversation.unreadCount > 0 && (
							<div className='w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0'>
								<span className='text-xs text-white font-medium'>
									{conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
								</span>
							</div>
						)}
					</Link>
				);
			})}
		</div>
	);
}
