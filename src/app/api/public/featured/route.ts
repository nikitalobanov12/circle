import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/public/featured - Get featured public content for guest browsing
export async function GET() {
	try {
		// Get public circles (non-private) with most members
		const featuredCircles = await prisma.circle.findMany({
			where: {
				isPrivate: false,
			},
			select: {
				id: true,
				name: true,
				description: true,
				avatar: true,
				createdAt: true,
				_count: {
					select: {
						members: true,
						Album: true,
					},
				},
			},
			orderBy: {
				members: {
					_count: 'desc',
				},
			},
			take: 12,
		});

		// Get recent public albums (from non-private circles or personal public albums)
		const featuredAlbums = await prisma.album.findMany({
			where: {
				isPrivate: false,
				OR: [
					{ circleId: null }, // Personal albums
					{
						Circle: {
							isPrivate: false,
						},
					},
				],
			},
			select: {
				id: true,
				title: true,
				description: true,
				coverImage: true,
				createdAt: true,
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
			orderBy: {
				createdAt: 'desc',
			},
			take: 20,
		});

		// Get some stats for the platform
		const stats = await prisma.$transaction([
			prisma.user.count(),
			prisma.circle.count({ where: { isPrivate: false } }),
			prisma.album.count({ where: { isPrivate: false } }),
			prisma.photo.count(),
		]);

		return NextResponse.json({
			circles: featuredCircles,
			albums: featuredAlbums,
			stats: {
				users: stats[0],
				publicCircles: stats[1],
				publicAlbums: stats[2],
				photos: stats[3],
			},
		});
	} catch (error) {
		console.error('Error fetching featured content:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
