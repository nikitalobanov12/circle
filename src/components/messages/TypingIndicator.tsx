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
		<div className='flex items-end gap-2 ml-10'>
			{/* Bubble style typing indicator */}
			<div className='bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm'>
				<div className='flex items-center gap-1.5'>
					<div className='flex gap-1'>
						<span 
							className='w-2 h-2 bg-[var(--foreground-secondary)] rounded-full animate-bounce' 
							style={{ animationDelay: '0ms', animationDuration: '1s' }} 
						/>
						<span 
							className='w-2 h-2 bg-[var(--foreground-secondary)] rounded-full animate-bounce' 
							style={{ animationDelay: '150ms', animationDuration: '1s' }} 
						/>
						<span 
							className='w-2 h-2 bg-[var(--foreground-secondary)] rounded-full animate-bounce' 
							style={{ animationDelay: '300ms', animationDuration: '1s' }} 
						/>
					</div>
				</div>
			</div>
			<span className='text-xs text-[var(--foreground-secondary)] mb-1'>{text}</span>
		</div>
	);
}
