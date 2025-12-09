'use client';

import { formatDistanceToNow } from 'date-fns';
import CircleHolder from '@/components/circle_holders';

interface Message {
	id: number;
	content: string;
	createdAt: string;
	senderId: number;
	sender: {
		id: number;
		name: string | null;
		username: string;
		profileImage: string | null;
	};
}

interface MessageBubbleProps {
	message: Message;
	isOwn: boolean;
	showAvatar: boolean;
}

export default function MessageBubble({ message, isOwn, showAvatar }: MessageBubbleProps) {
	return (
		<div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
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
			<div
				className={`max-w-[70%] px-4 py-2 rounded-2xl ${
					isOwn
						? 'bg-primary text-white rounded-br-md'
						: 'bg-background-secondary text-foreground rounded-bl-md'
				}`}
			>
				<p className='text-sm whitespace-pre-wrap break-words'>{message.content}</p>
				<p
					className={`text-xs mt-1 ${
						isOwn ? 'text-white/70' : 'text-foreground-secondary'
					}`}
				>
					{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
				</p>
			</div>
		</div>
	);
}
