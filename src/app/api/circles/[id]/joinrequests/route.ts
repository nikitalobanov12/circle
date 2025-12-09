import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { PrismaUtils } from '@/lib/prisma-utils';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		const resolvedParams = await params;
		const circleId = parseInt(resolvedParams.id, 10);
		if (isNaN(circleId)) {
			return NextResponse.json({ error: 'Invalid circle ID' }, { status: 400 });
		}

		const userId = parseInt(session.user.id);

		// Check if this is just a status check for current user
		const url = new URL(request.url);
		const checkRequestStatus = url.searchParams.get('checkRequestStatus');
		if (checkRequestStatus === 'true') {
			// Check if current user has already sent a join request
			const existingRequest = await prisma.activity.findFirst({
				where: {
					type: 'circle_join_request',
					circleId,
					requesterId: userId,
				},
			});

			return NextResponse.json({
				requestSent: !!existingRequest,
			});
		}
		// OPTIMIZATION: Use transaction to batch circle validation and permission checks
		const result = await PrismaUtils.transaction(async (tx) => {
			// Check permissions - only circle creator, moderators, and admins can see join requests
			const circle = await tx.circle.findUnique({
				where: { id: circleId },
				select: {
					creatorId: true,
					isPrivate: true,
				},
			});

			if (!circle) {
				return { error: 'Circle not found', status: 404 };
			}

			if (!circle.isPrivate) {
				return { error: 'Circle is not private', status: 400 };
			}

			// Check if user has permission to see join requests
			const membership =
				circle.creatorId === userId
					? { role: 'ADMIN' }
					: await tx.membership.findUnique({
							where: {
								userId_circleId: {
									userId,
									circleId,
								},
							},
							select: { role: true },
					  });

			if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'MODERATOR')) {
				return { error: 'Access denied', status: 403 };
			}

			// Get all join requests for the circle with requester data in single query
			const joinRequests = await tx.activity.findMany({
				where: {
					type: 'circle_join_request',
					circleId,
				},
				orderBy: { createdAt: 'desc' },
				include: {
					user: {
						select: {
							id: true,
							username: true,
							name: true,
							profileImage: true,
						},
					},
					requester: {
						select: {
							id: true,
							username: true,
							name: true,
							profileImage: true,
						},
					},
				},
			});

			return { joinRequests };
		});

		if ('error' in result) {
			return NextResponse.json({ error: result.error }, { status: result.status });
		}
		// Format the requests for display
		const processedRequests = result.joinRequests.map(request => {
			return {
				id: request.id,
				content: request.content,
				createdAt: request.createdAt,
				requesterId: request.requesterId,
				requester: request.requester,
			};
		});

		return NextResponse.json({ joinRequests: processedRequests });

		return NextResponse.json({ joinRequests: processedRequests });
	} catch (error) {
		console.error('Error getting circle join requests:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

// PATCH endpoint for accepting/declining join requests
export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const circleId = parseInt(params.id, 10);
		if (isNaN(circleId)) {
			return NextResponse.json({ error: 'Invalid circle ID' }, { status: 400 });
		}

		const userId = parseInt(session.user.id);
		const { requestId, action } = await request.json();

		if (!requestId || !action || !['accept', 'decline'].includes(action)) {
			return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
		}

		// Check permissions - only circle creator, moderators, and admins can handle join requests
		const circle = await prisma.circle.findUnique({
			where: { id: circleId },
			select: {
				id: true,
				name: true,
				creatorId: true,
				isPrivate: true,
			},
		});

		if (!circle) {
			return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
		}

		if (!circle.isPrivate) {
			return NextResponse.json({ error: 'Circle is not private' }, { status: 400 });
		}

		// Check if user has permission
		const membership =
			circle.creatorId === userId
				? { role: 'ADMIN' }
				: await prisma.membership.findUnique({
						where: {
							userId_circleId: {
								userId,
								circleId,
							},
						},
						select: { role: true },
				  });

		if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'MODERATOR')) {
			return NextResponse.json({ error: 'Access denied' }, { status: 403 });
		}
		// Get the join request
		const joinRequest = await prisma.activity.findFirst({
			where: {
				id: requestId,
				type: 'circle_join_request',
				circleId,
			},
		});

		if (!joinRequest) {
			return NextResponse.json({ error: 'Join request not found' }, { status: 404 });
		}

		// Get the requester ID directly from the join request
		const requesterId = joinRequest.requesterId;

		if (!requesterId) {
			return NextResponse.json({ error: 'Invalid join request format' }, { status: 400 });
		}

		if (action === 'accept') {
			// Check if user is already a member
			const existingMembership = await prisma.membership.findUnique({
				where: {
					userId_circleId: {
						userId: requesterId,
						circleId,
					},
				},
			});

			if (existingMembership) {
				// Delete the request if user is already a member
				await prisma.activity.delete({
					where: { id: requestId },
				});

				return NextResponse.json({
					success: true,
					message: 'User is already a member of this circle',
				});
			} // Get the user information
			const user = await prisma.user.findUnique({
				where: { id: requesterId },
				select: { name: true, username: true },
			});

			const userName = user?.name || user?.username || 'A user';

			// Add the user to the circle and remove the request
			await prisma.$transaction([
				// Delete the request
				prisma.activity.delete({
					where: { id: requestId },
				}),
				// Create membership
				prisma.membership.create({
					data: {
						userId: requesterId,
						circleId,
						role: 'MEMBER',
					},
				}),
				// Create activity for the requester
				prisma.activity.create({
					data: {
						type: 'circle_join_accepted',
						content: `Your request to join "${circle.name}" has been accepted`,
						userId: requesterId,
						circleId,
					},
				}), // Create activity for the circle
				prisma.activity.create({
					data: {
						type: 'circle_new_member',
						content: `${userName} joined the circle "${circle.name}"`,
						userId: circle.creatorId,
						circleId,
					},
				}),
			]);

			return NextResponse.json({
				success: true,
				message: 'Join request accepted',
			});
		} else if (action === 'decline') {
			// Just delete the request
			await prisma.activity.delete({
				where: { id: requestId },
			});

			return NextResponse.json({
				success: true,
				message: 'Join request declined',
			});
		}

		return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
	} catch (error) {
		console.error('Error handling circle join request:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
