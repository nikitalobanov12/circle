import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaUtils } from '@/lib/prisma-utils';

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
		const albumId = parseInt(params.id);

		if (isNaN(albumId)) {
			return NextResponse.json({ error: 'Invalid album ID' }, { status: 400 });
		}

		// Get session data
		const session = await auth();
		const userId = session?.user ? parseInt(session.user.id) : null;

		// OPTIMIZATION: Use transaction to batch all queries
		const result = await PrismaUtils.transaction(async tx => {
			// Check if the album exists
			const album = await tx.album.findUnique({
				where: { id: albumId },
				include: {
					creator: {
						select: {
							id: true,
							username: true,
							name: true,
							profileImage: true,
						},
					},
					Circle: {
						select: {
							id: true,
							name: true,
							avatar: true,
							isPrivate: true,
						},
					},
					_count: {
						select: {
							Photo: true,
							AlbumLike: true,
							AlbumComment: true,
						},
					},
				},
			});

			if (!album) {
				return null;
			}

			// Batch permission check and photo/like queries
			const queries = [
				// Get photos for this album
				tx.photo.findMany({
					where: { albumId: albumId },
					orderBy: { createdAt: 'desc' },
				}),
			];

			// Add permission queries if needed
			if (album.isPrivate && album.circleId && userId) {
				queries.push(
					// Check if user is a member of the circle
					tx.membership.findUnique({
						where: {
							userId_circleId: {
								userId: userId,
								circleId: album.circleId,
							},
						},
					})
				);
			}

			// Add like status query if user is logged in
			if (userId) {
				queries.push(
					tx.albumLike.findUnique({
						where: {
							userId_albumId: {
								userId: userId,
								albumId: albumId,
							},
						},
					})
				);
			}

			const results = await Promise.all(queries);
			const photos = results[0];
			const membership = album.isPrivate && album.circleId && userId ? results[1] : null;
			const like = userId ? results[results.length - 1] : null;

			return { album, photos, membership, like };
		});

		if (!result) {
			return NextResponse.json({ error: 'Album not found' }, { status: 404 });
		}

		const { album, photos, membership, like } = result;

		// Check if the user has permission to view this album
		if (album.isPrivate) {
			const isCreator = album.creatorId === userId;
			const isCircleMember = album.circleId && membership;

			if (!isCreator && !isCircleMember) {
				return NextResponse.json({ error: 'You do not have permission to view this private album' }, { status: 403 });
			}
		}

		// Format like status
		const userLikeStatus = userId ? (like ? true : false) : null;

		return NextResponse.json({
			album,
			photos,
			userLikeStatus,
		});
	} catch (error) {
		console.error('Error fetching album photos:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
		const resolvedParamsId = await params.id;
		const albumId = parseInt(resolvedParamsId);
		console.log('Processing photo upload for album:', albumId);

		if (isNaN(albumId)) {
			return NextResponse.json({ error: 'Invalid album ID' }, { status: 400 });
		}

		// Verify authentication
		const session = await auth();
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		const userId = parseInt(session.user.id);

		// OPTIMIZATION: Use transaction to batch album check and permission validation
		const albumResult = await PrismaUtils.transaction(async tx => {
			// Check if the album exists
			const album = await tx.album.findUnique({
				where: { id: albumId },
			});

			if (!album) {
				return null;
			}

			let membership = null;
			// For circle albums, check membership
			if (album.circleId) {
				membership = await tx.membership.findUnique({
					where: {
						userId_circleId: {
							userId: userId,
							circleId: album.circleId,
						},
					},
				});
			}

			return { album, membership };
		});

		if (!albumResult) {
			return NextResponse.json({ error: 'Album not found' }, { status: 404 });
		}

		const { album, membership } = albumResult;

		const canAddToPersonalAlbum = album.creatorId === userId;
		const canAddToCircleAlbum = album.circleId ? !!membership : false;

		if (!canAddToPersonalAlbum && !canAddToCircleAlbum) {
			return NextResponse.json({ error: 'You do not have permission to add photos to this album' }, { status: 403 });
		} // Process form data for photo upload
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const description = (formData.get('description') as string) || '';
		const isCoverImage = formData.get('isCoverImage') === 'true';

		if (!file) {
			return NextResponse.json({ error: 'No file provided' }, { status: 400 });
		} // Convert file to buffer
		const bytes = await file.arrayBuffer();
		const buffer = new Uint8Array(bytes);

		// Import the uploadToCloudinary function
		const { uploadToCloudinary } = await import('@/lib/cloudinary');

		// Upload to Cloudinary
		let imageData;
		try {
			// Use the existing uploadToCloudinary function
			imageData = await uploadToCloudinary(buffer, 'albums', `album_${albumId}`);

			if (!imageData || !imageData.secure_url) {
				console.error('Failed to get secure_url from Cloudinary response', imageData);
				return NextResponse.json({ error: 'Failed to upload image to Cloudinary' }, { status: 500 });
			}

			console.log('Successfully uploaded to Cloudinary:', imageData.secure_url);
		} catch (error) {
			console.error('Error in Cloudinary upload:', error);
			return NextResponse.json(
				{
					error: 'Failed to upload image to Cloudinary',
					details: error instanceof Error ? error.message : String(error),
				},
				{ status: 500 }
			);
		}
		// Create the photo in the database
		const createdPhoto = await prisma.photo.create({
			data: {
				url: imageData.secure_url,
				description: description,
				albumId,
				updatedAt: new Date(),
			},
		}); // Update the album's coverImage if this is marked as cover image or if album doesn't have one
		if (isCoverImage || !album.coverImage) {
			await prisma.album.update({
				where: { id: albumId },
				data: {
					coverImage: createdPhoto.url,
				},
			});
		}

		return NextResponse.json({
			success: true,
			photo: createdPhoto,
			message: `Added photo to the album`,
		});
	} catch (error) {
		console.error('Error adding photos to album:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
