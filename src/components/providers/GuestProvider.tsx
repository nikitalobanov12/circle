'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface GuestContextType {
	isGuest: boolean;
	isAuthenticated: boolean;
	enterGuestMode: () => void;
	exitGuestMode: () => void;
	promptSignUp: (action?: string) => void;
	showSignUpPrompt: boolean;
	signUpPromptAction: string | null;
	dismissSignUpPrompt: () => void;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export function GuestProvider({ children }: { children: ReactNode }) {
	const { data: session, status } = useSession();
	const [isGuestMode, setIsGuestMode] = useState(false);
	const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
	const [signUpPromptAction, setSignUpPromptAction] = useState<string | null>(null);

	const isAuthenticated = status === 'authenticated' && !!session?.user;
	const isGuest = !isAuthenticated && isGuestMode;

	const enterGuestMode = useCallback(() => {
		setIsGuestMode(true);
	}, []);

	const exitGuestMode = useCallback(() => {
		setIsGuestMode(false);
	}, []);

	const promptSignUp = useCallback((action?: string) => {
		setSignUpPromptAction(action || null);
		setShowSignUpPrompt(true);
	}, []);

	const dismissSignUpPrompt = useCallback(() => {
		setShowSignUpPrompt(false);
		setSignUpPromptAction(null);
	}, []);

	return (
		<GuestContext.Provider
			value={{
				isGuest,
				isAuthenticated,
				enterGuestMode,
				exitGuestMode,
				promptSignUp,
				showSignUpPrompt,
				signUpPromptAction,
				dismissSignUpPrompt,
			}}
		>
			{children}
		</GuestContext.Provider>
	);
}

export function useGuest() {
	const context = useContext(GuestContext);
	if (context === undefined) {
		throw new Error('useGuest must be used within a GuestProvider');
	}
	return context;
}
