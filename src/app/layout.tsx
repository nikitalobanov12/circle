import type { Metadata } from 'next';
import './globals.css';
import NextThemeProvider from '../components/theme/NextThemeProvider';
import { SessionProvider } from '../components/providers/SessionProvider';
import { GuestProvider } from '../components/providers/GuestProvider';
import SignUpPromptModal from '@/components/guest/SignUpPromptModal';

export const metadata: Metadata = {
	title: 'Circles',
	description: 'A social media app for connecting with friends',
 	icons: {
		icon: '/Logo.svg',
		apple: '/Logo.svg',
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html
			lang='en'
			suppressHydrationWarning
		>
			<body className='antialiased pb-4 lg:pb-0'>
				<SessionProvider>
					<GuestProvider>
						<NextThemeProvider>
							{children}
							<SignUpPromptModal />
						</NextThemeProvider>
					</GuestProvider>
				</SessionProvider>
			</body>
		</html>
	);
}
