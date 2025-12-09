import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { PrismaUtils } from '@/lib/prisma-utils';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
		const session = await auth();
		const userId = session?.user?.id ? parseInt(session.user.id, 10) : null;
		const circleId = parseInt(params.id, 10);

		if (isNaN(circleId)) {
			return NextResponse.json({ error: 'Invalid circle ID' }, { status: 400 });
		}
		// Check circle access and get albums in a single transaction
		const [circle, membership, albums] = await PrismaUtils.transaction(async (tx) => {
			const circleQuery = tx.circle.findUnique({
				where: { id: circleId },
				select: {
					isPrivate: true,
					creatorId: true,
				},
			});

			const membershipQuery = userId ? tx.membership.findUnique({
				where: {
					userId_circleId: {
						userId: userId as number,
						circleId,
					},
				},
			}) : Promise.resolve(null);

			const albumsQuery = tx.album.findMany({
				where: { circleId },
				include: {
					creator: {
						select: {
							profileImage: true,
						},
					},
					_count: {
						select: {
							Photo: true,
						},
					},
				},
				orderBy: { createdAt: 'desc' },
			});

			return Promise.all([circleQuery, membershipQuery, albumsQuery]);
		});

		if (!circle) {
			return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
		}

		// For private circles, check if the user is a member
		if (circle.isPrivate && userId !== circle.creatorId && !membership) {
			return NextResponse.json({ error: 'Access denied to private circle' }, { status: 403 });
		}// Format the response
		const formattedAlbums = albums.map(album => ({
			id: album.id,
			title: album.title,
			coverImage: album.coverImage,
			creatorImage: album.creator?.profileImage || null,
			photoCount: album._count.Photo,
		}));

		return NextResponse.json(formattedAlbums);
	} catch (error) {
		console.error('Error fetching circle albums:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
