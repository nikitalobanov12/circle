'use client';

interface TypingIndicatorProps {
	userNames: string[];
}

export default function TypingIndicator({ userNames }: TypingIndicatorProps) {
	if (userNames.length === 0) return null;

	let text = '';
	if (userNames.length === 1) {
		text = `${userNames[0]} is typing`;
	} else if (userNames.length === 2) {
		text = `${userNames[0]} and ${userNames[1]} are typing`;
	} else {
		text = 'Several people are typing';
	}

	return (
		<div className='flex items-center gap-2 text-sm text-foreground-secondary'>
			<div className='flex gap-1'>
				<span className='w-2 h-2 bg-foreground-secondary rounded-full animate-bounce' style={{ animationDelay: '0ms' }} />
				<span className='w-2 h-2 bg-foreground-secondary rounded-full animate-bounce' style={{ animationDelay: '150ms' }} />
				<span className='w-2 h-2 bg-foreground-secondary rounded-full animate-bounce' style={{ animationDelay: '300ms' }} />
			</div>
			<span>{text}</span>
		</div>
	);
}
