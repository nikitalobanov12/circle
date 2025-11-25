'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { FaHeart, FaRegHeart, FaComment, FaPlus, FaPencilAlt } from 'react-icons/fa';
import { Session } from '@auth/core/types';
import CommentModal from './CommentModal';
import CroppablePhotoUpload from './CroppablePhotoUpload';
import PhotoBatchUpload from './PhotoBatchUpload';
import OptimizedImage from '../common/OptimizedImage';
import EditAlbumModal from './EditAlbumModal';
import { useAlbumLikes, AlbumLikesProvider } from './AlbumLikesContext';
import { toast } from 'react-hot-toast';

/**
 * Gets the display URL for an album cover image
 */
function getDisplayUrl(coverImage: string | null): string | null {
	if (!coverImage) return null;
	return coverImage;
}

interface Photo {
	id: number;
	url: string;
	description: string | null;
	createdAt: string;
}

interface AlbumDetailProps {
	album: {
		id: number;
		title: string;
		description: string | null;
		coverImage: string | null;
		createdAt: string;
		isPrivate: boolean;
		creatorId: number | null;
		circleId: number | null;
		Photo: Photo[];
		creator: {
			id: number;
			username: string;
			name: string | null;
			profileImage: string | null;
		} | null;
		Circle: {
			id: number;
			name: string;
			avatar: string | null;
		} | null;
		_count: {
			AlbumLike: number;
			AlbumComment: number;
			Photo: number;
		};
	};
	isLiked: boolean;
	session: Session | null;
}

const AlbumDetailContent: React.FC<AlbumDetailProps> = ({ album, isLiked: initialIsLiked, session }) => {
	const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
	const [isAddPhotoModalOpen, setIsAddPhotoModalOpen] = useState(false);
	const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [photos, setPhotos] = useState<Photo[]>(album.Photo);
	const [albumData, setAlbumData] = useState(album);
	const [isCircleMember, setIsCircleMember] = useState(false);

	// Process the album cover image to get the original URL if it's in JSON format
	const coverImageUrl = useMemo(() => getDisplayUrl(albumData.coverImage), [albumData.coverImage]);

	// Use the album likes context instead of local state
	const { likeStatuses, toggleLike, pendingAlbums } = useAlbumLikes();

	// Get like status from context or use initial value as fallback
	const isLiked = likeStatuses[album.id]?.liked ?? initialIsLiked;
	const likeCount = likeStatuses[album.id]?.likeCount ?? album._count.AlbumLike;
	const isPending = pendingAlbums.has(album.id);

	const handleLikeClick = async () => {
		if (isPending) return;

		if (!session?.user) {
			toast.error('Please log in to like albums');
			return;
		}

		await toggleLike(album.id);
	};

	// Check if user is a member of the circle
	useEffect(() => {
		if (session?.user?.id && album.Circle?.id) {
			fetch(`/api/circles/${album.Circle.id}/permissions`)
				.then(res => res.json())
				.then(data => {
					setIsCircleMember(!!data.role); // If user has a role, they are a member
				})
				.catch(err => console.error('Error checking circle membership:', err));
		}
	}, [session?.user?.id, album.Circle?.id]);

	const canAddPhotos =
		session?.user &&
		album.creatorId &&
		session.user.id &&
		// Creator can always add photos
		(parseInt(session.user.id) === album.creatorId ||
			// If it's a circle album, members of the circle can add photos too
			(album.Circle && isCircleMember));

	const canEditAlbum = session?.user && album.creatorId && session.user.id && parseInt(session.user.id) === album.creatorId;

	const handleAlbumUpdate = (updatedAlbum: any) => {
		setAlbumData({
			...albumData,
			title: updatedAlbum.title,
			description: updatedAlbum.description,
			coverImage: updatedAlbum.coverImage,
			isPrivate: updatedAlbum.isPrivate,
		});
	};

	const handleAddPhoto = (newPhoto: Photo) => {
		setPhotos(prevPhotos => [newPhoto, ...prevPhotos]);
	};

	const handlePhotoBatchComplete = () => {
		setIsBatchUploadOpen(false);

		// Reload photos
		fetch(`/api/albums/${album.id}/photos`)
			.then(response => response.json())
			.then(data => {
				setPhotos(data.photos);
			})
			.catch(error => {
				console.error('Error fetching updated photos:', error);
			});
	};

	return (
		<div className='min-h-screen bg-[var(--background)]'>
			<div className='w-full max-w-xl mx-auto px-4 py-10 mb-32'>
				{' '}
				<div className='flex flex-col gap-8 mb-8'>
					<div>
						<h1 className='text-3xl font-bold'>{albumData.title}</h1>
						{album.description && <p className='text-base text-[var(--foreground)] opacity-70 max-w-2xl'>{album.description}</p>}

						<div className='flex items-center mt-8 gap-6'>
							<button
								className={`flex items-center gap-2 hover:cursor-pointer ${isPending ? 'opacity-60' : 'hover:opacity-70'} transition-opacity`}
								aria-label={isLiked ? 'Unlike album' : 'Like album'}
								onClick={handleLikeClick}
								disabled={isPending}
							>
								{isLiked ? (
									<>
										<FaHeart className={`text-2xl text-red-500 ${isPending ? 'animate-pulse' : ''}`} />
										<span className='text-lg'>{likeCount}</span>
									</>
								) : (
									<>
										<FaRegHeart className={`text-2xl ${isPending ? 'animate-pulse' : ''}`} />
										<span className='text-lg'>{likeCount}</span>
									</>
								)}
							</button>

							<button
								className='flex items-center gap-2 hover:cursor-pointer hover:opacity-80 transition-opacity'
								aria-label='Comment on album'
								onClick={() => setIsCommentModalOpen(true)}
							>
								<FaComment className='text-2xl' />
								<span className='text-lg'>{album._count.AlbumComment}</span>
							</button>
						</div>
						{/* <p className='text-md text-[var(--foreground)] opacity-60 mt-3'>{photos.length} photos</p> */}
					</div>
					<div className='flex flex-wrap items-center  gap-4'>
						{canEditAlbum && (
							<button
								onClick={() => setIsEditModalOpen(true)}
								className='bg-[var(--foreground)] hover:opacity-70 bg-opacity-10 hover:bg-opacity-20 rounded-lg py-2 px-4 flex items-center gap-3 text-[var(--background)]'
								title='Edit album'
							>
								<FaPencilAlt size={18} /> <span className='hidden sm:inline'>Edit</span>
							</button>
						)}
						{canAddPhotos && (
							<>
								{' '}
								<button
									onClick={() => setIsBatchUploadOpen(true)}
									className='bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg py-2 px-4 flex items-center gap-3 text-[var(--background)] whitespace-nowrap'
									title='Add multiple photos at once'
								>
									<FaPlus size={18} /> Add Photos
								</button>
							</>
						)}
					</div>{' '}
					<div className='flex flex-col justify-between gap-6'>
						<div className='flex flex-col gap-4'>
							{album.creator && (
								<div className='flex items-center'>
									<Link
										href={`/${album.creator.username}`}
										className='flex items-center gap-3 hover:opacity-80 transition-opacity'
									>
										{' '}
										<OptimizedImage
											src={album.creator.profileImage || '/images/default-avatar.png'}
											alt={album.creator.username}
											width={48}
											height={48}
											className='rounded-full aspect-square object-cover'
											fallbackSrc='/images/default-avatar.png'
										/>
										<div>
											<span className='text-xs opacity-60'>Created by</span>
											<span className='font-medium block'>{album.creator.name || album.creator.username}</span>
										</div>
									</Link>
								</div>
							)}

							{album.Circle && (
								<div className='flex items-center'>
									{' '}
									<Link
										href={`/circle/${album.Circle.id}`}
										className='flex items-center gap-3 hover:opacity-80 transition-opacity'
									>
										{' '}
										<OptimizedImage
											src={album.Circle.avatar || '/images/circles/default.svg'}
											alt={album.Circle.name}
											width={48}
											height={48}
											className='rounded-full object-cover border border-[var(--primary)] border-opacity-30'
											fallbackSrc='/images/circles/default.svg'
										/>
										<div>
											<span className='text-xs opacity-60'>Circle</span>
											<span className='font-medium block'>{album.Circle.name}</span>
										</div>
									</Link>
								</div>
							)}
						</div>{' '}
					</div>
				</div>
				<h2>
					{photos.length} photo{photos.length > 1 ? "'s" : ''}
				</h2>
				{photos.length > 0 ? (
					<div className='mx-auto columns-2 gap-4 space-y-4'>
						{photos.map(photo => (
							<div
								key={photo.id}
								className='break-inside-avoid rounded-xl overflow-hidden mb-4 shadow-sm hover:shadow-md transition-shadow duration-300'
							>
								{' '}
								<div className='flex justify-center'>
									<OptimizedImage
										src={photo.url}
										alt={photo.description || `Photo ${photo.id}`}
										width={800}
										height={800}
										className='w-full h-auto block'
										sizes='(max-width: 640px) 100vw, 50vw'
										fallbackSrc='/images/albums/default.svg'
									/>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className='flex flex-col items-center justify-center py-16'>
						<p className='text-xl text-[var(--foreground)] opacity-60 mb-3'>No photos in this album yet</p>
						{canAddPhotos && (
							<div className='flex flex-wrap gap-4 mt-6'>
								{' '}
								<button
									onClick={() => setIsAddPhotoModalOpen(true)}
									className='bg-[var(--foreground)] bg-opacity-10 hover:bg-opacity-20 rounded-lg px-6 py-3 flex items-center gap-3 text-[var(--primary)] transition-all'
								>
									<FaPlus size={18} /> Add Photo
								</button>{' '}
								<button
									onClick={() => setIsBatchUploadOpen(true)}
									className='bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg px-6 py-3 flex items-center gap-3 text-[var(--background)] transition-all'
								>
									<FaPlus size={18} /> Add Multiple Photos
								</button>
							</div>
						)}
					</div>
				)}
				{isCommentModalOpen && (
					<CommentModal
						albumId={album.id}
						isOpen={isCommentModalOpen}
						onClose={() => setIsCommentModalOpen(false)}
					/>
				)}
				{isAddPhotoModalOpen && (
					<CroppablePhotoUpload
						albumId={album.id}
						isOpen={isAddPhotoModalOpen}
						onClose={() => setIsAddPhotoModalOpen(false)}
						onPhotoAdded={handleAddPhoto}
					/>
				)}
				{isBatchUploadOpen && (
					<div className='fixed inset-0 bg-[rgba(0,0,0,0.6)] flex items-center justify-center z-100 p-4'>
						<div className='bg-[var(--background)] rounded-xl max-w-4xl w-full overflow-hidden shadow-xl'>
							<PhotoBatchUpload
								albumId={album.id}
								onComplete={handlePhotoBatchComplete}
								onCancel={() => setIsBatchUploadOpen(false)}
							/>
						</div>
					</div>
				)}{' '}
				{isEditModalOpen && (
					<EditAlbumModal
						album={{
							id: albumData.id,
							title: albumData.title,
							description: albumData.description,
							coverImage: albumData.coverImage,
							isPrivate: albumData.isPrivate,
						}}
						isOpen={isEditModalOpen}
						onClose={() => setIsEditModalOpen(false)}
						onUpdate={handleAlbumUpdate}
						photos={photos}
					/>
				)}
			</div>
		</div>
	);
};

// Wrapper component to provide the AlbumLikesContext
const AlbumDetail: React.FC<AlbumDetailProps> = props => {
	return (
		<AlbumLikesProvider albumIds={[props.album.id]}>
			<AlbumDetailContent {...props} />
		</AlbumLikesProvider>
	);
};

export default AlbumDetail;
