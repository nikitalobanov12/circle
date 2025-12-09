'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

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

	return (
		<form onSubmit={handleSubmit} className='p-4 border-t border-border bg-background'>
			<div className='flex items-end gap-2'>
				<div className='flex-1 relative'>
					<textarea
						ref={textareaRef}
						value={content}
						onChange={handleChange}
						onKeyDown={handleKeyDown}
						placeholder='Type a message...'
						rows={1}
						disabled={disabled}
						className='w-full px-4 py-3 bg-background-secondary rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50'
						style={{ maxHeight: '120px' }}
					/>
				</div>
				<button
					type='submit'
					disabled={!content.trim() || disabled}
					className='p-3 bg-primary text-white rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0'
				>
					<FaPaperPlane className='w-5 h-5' />
				</button>
			</div>
		</form>
	);
}
