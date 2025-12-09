'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';

interface AlbumLikeStatus {
	liked: boolean;
	likeCount: number;
}

interface AlbumLikesContextType {
	likeStatuses: Record<number, AlbumLikeStatus>;
	toggleLike: (albumId: number) => Promise<void>;
	isLoading: boolean;
	pendingAlbums: Set<number>;
}

const AlbumLikesContext = createContext<AlbumLikesContextType | undefined>(undefined);

export function useAlbumLikes() {
	const context = useContext(AlbumLikesContext);
	if (!context) {
		throw new Error('useAlbumLikes must be used within an AlbumLikesProvider');
	}
	return context;
}

interface AlbumLikesProviderProps {
	children: ReactNode;
	albumIds: number[];
}

export function AlbumLikesProvider({ children, albumIds }: AlbumLikesProviderProps) {
	const [likeStatuses, setLikeStatuses] = useState<Record<number, AlbumLikeStatus>>({});
	const [isLoading, setIsLoading] = useState(false);
	const [pendingAlbums, setPendingAlbums] = useState<Set<number>>(new Set());	// Memoize albumIds array to prevent unnecessary re-fetches
	const albumIdsString = JSON.stringify(albumIds);
	const memoizedAlbumIds = useMemo(() => albumIds, [albumIds]);

	const fetchLikeStatuses = useCallback(async () => {
		if (!memoizedAlbumIds.length) return;

		setIsLoading(true);
		try {
			const response = await fetch('/api/albums/batch-like-status', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ albumIds: memoizedAlbumIds }),			});

				// Handle unauthorized (guest) users gracefully - just show default like statuses
				if (response.status === 401) {
					// Initialize with default "not liked" status for guests
					const defaultStatuses = memoizedAlbumIds.reduce((acc, albumId) => {
						acc[albumId] = { liked: false, likeCount: 0 };
						return acc;
					}, {} as Record<number, AlbumLikeStatus>);
					setLikeStatuses(defaultStatuses);
					return;
				}

				if (response.ok) {
					const data = await response.json();
					setLikeStatuses(data);
				} else {
					console.error('Failed to fetch like statuses');
				}
			} catch (error) {
				console.error('Error fetching like statuses:', error);
			} finally {
				setIsLoading(false);
			}
		}, [memoizedAlbumIds]);

	useEffect(() => {
		fetchLikeStatuses();
	}, [fetchLikeStatuses]);

	// Toggle like status for a single album with optimistic update
	const toggleLike = useCallback(async (albumId: number) => {
		// Skip if this album is already being processed
		if (pendingAlbums.has(albumId)) {
			return;
		}

		// Get current like status
		const currentStatus = likeStatuses[albumId] || { liked: false, likeCount: 0 };
		const newLikedStatus = !currentStatus.liked;
		const newLikeCount = newLikedStatus ? currentStatus.likeCount + 1 : Math.max(0, currentStatus.likeCount - 1);

		// Update pending state to prevent duplicate requests
		setPendingAlbums(prev => {
			const updated = new Set(prev);
			updated.add(albumId);
			return updated;
		});

		// Optimistically update UI
		setLikeStatuses(prev => ({
			...prev,
			[albumId]: {
				liked: newLikedStatus,
				likeCount: newLikeCount,
			},
		}));

		// Show subtle toast notification
		const toastId = toast.loading(newLikedStatus ? 'Liking album...' : 'Unliking album...', { duration: 2000 });

		try {
			const response = await fetch(`/api/albums/${albumId}/like`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				throw new Error('Failed to update like status');
			}

			const data = await response.json();

			// Toast success message
			toast.success(data.liked ? 'Album liked' : 'Album unliked', { id: toastId });
		} catch (error) {
			console.error('Error toggling like:', error);

			// Revert the optimistic update
			setLikeStatuses(prev => ({
				...prev,
				[albumId]: currentStatus,
			}));

			// Show error toast
			toast.error('Failed to update like status', { id: toastId });
		} finally {
			// Remove album from pending set
			setPendingAlbums(prev => {
				const updated = new Set(prev);
				updated.delete(albumId);
				return updated;
			});
		}
	}, [likeStatuses, pendingAlbums]);

	const value = useMemo(() => ({
		likeStatuses,
		toggleLike,
		isLoading,
		pendingAlbums,
	}), [likeStatuses, toggleLike, isLoading, pendingAlbums]);

	return <AlbumLikesContext.Provider value={value}>{children}</AlbumLikesContext.Provider>;
}
