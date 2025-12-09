'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
	onSend: (content: string) => void;
	onTyping: (isTyping: boolean) => void;
	disabled?: boolean;
}

export default function MessageInput({ onSend, onTyping, disabled }: MessageInputProps) {
	const [content, setContent] = useState('');
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isTypingRef = useRef(false);

	// Auto-resize textarea
	useEffect(() => {
		const textarea = textareaRef.current;
		if (textarea) {
			textarea.style.height = 'auto';
			textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
		}
	}, [content]);

	// Handle typing indicator
	const handleTypingStart = useCallback(() => {
		if (!isTypingRef.current) {
			isTypingRef.current = true;
			onTyping(true);
		}

		// Clear existing timeout
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}

		// Set new timeout to stop typing indicator
		typingTimeoutRef.current = setTimeout(() => {
			isTypingRef.current = false;
			onTyping(false);
		}, 2000);
	}, [onTyping]);

	// Cleanup typing timeout on unmount
	useEffect(() => {
		return () => {
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
			if (isTypingRef.current) {
				onTyping(false);
			}
		};
	}, [onTyping]);

	const handleSubmit = (e?: React.FormEvent) => {
		e?.preventDefault();
		
		if (!content.trim() || disabled) return;

		// Stop typing indicator
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}
		if (isTypingRef.current) {
			isTypingRef.current = false;
			onTyping(false);
		}

		onSend(content.trim());
		setContent('');

		// Reset textarea height
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setContent(e.target.value);
		if (e.target.value.trim()) {
			handleTypingStart();
		}
	};

	const hasContent = content.trim().length > 0;

	return (
		<form onSubmit={handleSubmit} className='px-4 py-3 border-t border-[var(--border)] bg-[var(--background)]'>
			<div className='flex items-end gap-3'>
				<div className='flex-1 relative'>
					<textarea
						ref={textareaRef}
						value={content}
						onChange={handleChange}
						onKeyDown={handleKeyDown}
						placeholder='Message...'
						rows={1}
						disabled={disabled}
						className='w-full px-4 py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-3xl resize-none text-[15px] text-[var(--foreground)] placeholder:text-[var(--foreground-secondary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/30 disabled:opacity-50 transition-colors'
						style={{ maxHeight: '120px' }}
					/>
				</div>
				<button
					type='submit'
					disabled={!hasContent || disabled}
					className={`
						p-2.5 rounded-full flex-shrink-0 transition-all duration-200
						${hasContent 
							? 'bg-[var(--primary)] text-white shadow-md hover:shadow-lg hover:scale-105' 
							: 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)] cursor-not-allowed'
						}
						disabled:hover:scale-100 disabled:hover:shadow-none
					`}
				>
					<Send className={`w-5 h-5 ${hasContent ? '' : 'opacity-50'}`} />
				</button>
			</div>
		</form>
	);
}
