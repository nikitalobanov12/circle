'use client';

import { formatDistanceToNow } from 'date-fns';
import CircleHolder from '@/components/circle_holders';
import { RotateCcw, Check, CheckCheck } from 'lucide-react';

export type MessageStatus = 'sending' | 'sent' | 'failed';

export interface BaseMessage {
	id: number | string;
	content: string;
	createdAt: string;
	senderId: number;
	sender: {
		id: number;
		name: string | null;
		username: string;
		profileImage: string | null;
	};
	status?: MessageStatus;
	tempId?: string;
}

interface MessageBubbleProps<T extends BaseMessage = BaseMessage> {
	message: T;
	isOwn: boolean;
	showAvatar: boolean;
	onRetry?: (message: T) => void;
}

export default function MessageBubble<T extends BaseMessage>({ message, isOwn, showAvatar, onRetry }: MessageBubbleProps<T>) {
	const status = message.status || 'sent';
	const isFailed = status === 'failed';
	const isSending = status === 'sending';

	return (
		<div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
			{/* Avatar for other user's messages */}
			{!isOwn && (
				<div className='w-8 flex-shrink-0'>
					{showAvatar && (
						<CircleHolder
							imageSrc={message.sender.profileImage || '/images/default-avatar.png'}
							circleSize={32}
							showName={false}
						/>
					)}
				</div>
			)}
			
			<div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
				{/* Message bubble */}
				<div
					className={`
						relative px-4 py-2.5 shadow-sm
						${isOwn
							? isFailed
								? 'bg-red-500 text-white rounded-2xl rounded-br-sm'
								: 'bg-[var(--primary)] text-white rounded-2xl rounded-br-sm'
							: 'bg-[var(--background-secondary)] text-[var(--foreground)] rounded-2xl rounded-bl-sm border border-[var(--border)]'
						}
						${isSending ? 'opacity-70' : ''}
					`}
				>
					{/* Message content */}
					<p className='text-[15px] leading-relaxed whitespace-pre-wrap break-words'>
						{message.content}
					</p>
					
					{/* Timestamp and status */}
					<div className={`flex items-center gap-1.5 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
						<span
							className={`text-[11px] ${
								isOwn ? 'text-white/70' : 'text-[var(--foreground-secondary)]'
							}`}
						>
							{isFailed
								? 'Failed'
								: formatDistanceToNow(new Date(message.createdAt), { addSuffix: false })}
						</span>
						
						{/* Status indicator for own messages */}
						{isOwn && (
							<span className='flex items-center'>
								{isSending ? (
									<div className='w-3 h-3 border-[1.5px] border-white/60 border-t-transparent rounded-full animate-spin' />
								) : isFailed ? (
									<span className='text-white/90 text-[11px]'>!</span>
								) : (
									<CheckCheck className='w-3.5 h-3.5 text-white/70' />
								)}
							</span>
						)}
					</div>
				</div>
				
				{/* Retry button for failed messages */}
				{isFailed && onRetry && (
					<button
						onClick={() => onRetry(message)}
						className='flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 mt-1.5 px-1 transition-colors'
					>
						<RotateCcw className='w-3 h-3' />
						<span>Tap to retry</span>
					</button>
				)}
			</div>
		</div>
	);
}
