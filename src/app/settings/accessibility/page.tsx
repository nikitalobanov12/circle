'use client';
import { useState, useEffect } from 'react';
import { FaMoon, FaLowVision, FaFont } from 'react-icons/fa';
import { useTheme } from 'next-themes';
import NavBar from '@/components/bottom_bar/NavBar';

export default function AccessibilityPage() {
	const { theme, setTheme } = useTheme();
	const [contrast, setContrast] = useState(false);
	const [fontSize, setFontSize] = useState('medium');
	const [isLoading, setIsLoading] = useState(true);

	// Fetch user settings on component mount
	useEffect(() => {
		async function fetchSettings() {
			try {
				const response = await fetch('/api/settings');
				if (response.ok) {
					const settings = await response.json();
					setTheme(settings.darkMode ? 'dark' : 'light');
					setContrast(settings.highContrast);
					setFontSize(settings.fontSize);
				}
			} catch (error) {
				console.error('Error fetching settings:', error);
			} finally {
				setIsLoading(false);
			}
		}

		fetchSettings();
	}, [setTheme]);
	return (
		<div className='min-h-screen bg-[var(--background)] text-[var(--foreground)]'>
			<div className='w-full max-w-xl mx-auto px-4 py-6'>
				<h1 className='text-2xl font-bold mb-6 text-center'>Accessibility</h1>

				{isLoading ? (
					<div className='flex justify-center items-center py-10'>
						<div className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--primary)]'></div>
					</div>
				) : (
					<>
						{' '}
						{/* Darkmode*/}
						<div className='bg-[var(--foreground)] text-[var(--background)] p-4 rounded-lg flex items-center mb-4'>
							<FaMoon className='text-xl mr-3' />
							<span>Dark / Light Mode</span>
						</div>
						<div className='mb-6 space-y-2'>
							<label className='flex items-center justify-between'>
								<span>Dark Mode (Default)</span>
								<input
									type='radio'
									name='theme'
									checked={theme === 'dark'}
									onChange={() => {
										setTheme('dark');
										// Save setting to API
										fetch('/api/settings', {
											method: 'POST',
											headers: { 'Content-Type': 'application/json' },
											body: JSON.stringify({ darkMode: true }),
										});
									}}
								/>
							</label>
							<label className='flex items-center justify-between'>
								<span>Light Mode</span>
								<input
									type='radio'
									name='theme'
									checked={theme === 'light'}
									onChange={() => {
										setTheme('light');
										// Save setting to API
										fetch('/api/settings', {
											method: 'POST',
											headers: { 'Content-Type': 'application/json' },
											body: JSON.stringify({ darkMode: false }),
										});
									}}
								/>
							</label>
						</div>{' '}
						<div className='bg-[var(--foreground)] text-[var(--background)] p-4 rounded-lg flex items-center mb-4'>
							<FaLowVision className='text-xl mr-3' />
							<span>Contrast</span>
						</div>
						<div className='mb-6 flex items-center justify-between'>
							<span>Increase Contrast</span>
							<input
								type='checkbox'
								className='toggle toggle-sm toggle-primary'
								checked={contrast}
								onChange={() => setContrast(!contrast)}
							/>
						</div>{' '}
						{/* Fontsize*/}
						<div className='bg-[var(--foreground)] text-[var(--background)] p-4 rounded-lg flex items-center mb-4'>
							<FaFont className='text-xl mr-3' />
							<span>Font Size</span>
						</div>
						<div className='space-y-2'>
							<label className='flex items-center justify-between'>
								<span>Large</span>
								<input
									type='radio'
									name='font'
									checked={fontSize === 'large'}
									onChange={() => setFontSize('large')}
								/>
							</label>
							<label className='flex items-center justify-between'>
								<span>Medium (Default)</span>
								<input
									type='radio'
									name='font'
									checked={fontSize === 'medium'}
									onChange={() => setFontSize('medium')}
								/>
							</label>
							<label className='flex items-center justify-between'>
								<span>Small</span>
								<input
									type='radio'
									name='font'
									checked={fontSize === 'small'}
									onChange={() => setFontSize('small')}
								/>{' '}
							</label>
						</div>
					</>
				)}
			</div>
			<NavBar/>
		</div>
	);
}
