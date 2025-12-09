import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// GET /api/messages/conversations - Get all conversations for the current user
export async function GET() {
	try {
		const session = await auth();
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = parseInt(session.user.id);

		const conversations = await prisma.conversation.findMany({
			where: {
				participants: {
					some: {
						userId,
					},
				},
			},
			include: {
				participants: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								username: true,
								profileImage: true,
							},
						},
					},
				},
				messages: {
					orderBy: {
						createdAt: 'desc',
					},
					take: 1,
					include: {
						sender: {
							select: {
								id: true,
								name: true,
								username: true,
							},
						},
					},
				},
			},
			orderBy: {
				updatedAt: 'desc',
			},
		});

		// Get unread counts for each conversation
		const conversationsWithUnread = await Promise.all(
			conversations.map(async conv => {
				const participant = conv.participants.find(p => p.userId === userId);
				const unreadCount = await prisma.message.count({
					where: {
						conversationId: conv.id,
						senderId: { not: userId },
						createdAt: {
							gt: participant?.lastReadAt || new Date(0),
						},
					},
				});

				// Get the other participant(s) for display
				const otherParticipants = conv.participants.filter(p => p.userId !== userId);

				return {
					id: conv.id,
					participants: otherParticipants.map(p => p.user),
					lastMessage: conv.messages[0] || null,
					unreadCount,
					updatedAt: conv.updatedAt,
				};
			})
		);

		return NextResponse.json(conversationsWithUnread);
	} catch (error) {
		console.error('Error fetching conversations:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

// POST /api/messages/conversations - Create or get existing conversation with a user
export async function POST(request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = parseInt(session.user.id);
		const { participantId } = await request.json();

		if (!participantId) {
			return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
		}

		const otherUserId = parseInt(participantId);

		if (otherUserId === userId) {
			return NextResponse.json({ error: 'Cannot create conversation with yourself' }, { status: 400 });
		}

		// Check if the other user exists
		const otherUser = await prisma.user.findUnique({
			where: { id: otherUserId },
		});

		if (!otherUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// Check if a conversation already exists between these two users
		const existingConversation = await prisma.conversation.findFirst({
			where: {
				AND: [
					{
						participants: {
							some: { userId },
						},
					},
					{
						participants: {
							some: { userId: otherUserId },
						},
					},
				],
			},
			include: {
				participants: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								username: true,
								profileImage: true,
							},
						},
					},
				},
			},
		});

		if (existingConversation) {
			return NextResponse.json({
				id: existingConversation.id,
				participants: existingConversation.participants
					.filter(p => p.userId !== userId)
					.map(p => p.user),
				isNew: false,
			});
		}

		// Create new conversation
		const newConversation = await prisma.conversation.create({
			data: {
				participants: {
					create: [{ userId }, { userId: otherUserId }],
				},
			},
			include: {
				participants: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								username: true,
								profileImage: true,
							},
						},
					},
				},
			},
		});

		return NextResponse.json({
			id: newConversation.id,
			participants: newConversation.participants
				.filter(p => p.userId !== userId)
				.map(p => p.user),
			isNew: true,
		});
	} catch (error) {
		console.error('Error creating conversation:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
