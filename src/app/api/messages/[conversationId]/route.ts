import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import pusherServer from '@/lib/pusher-server';

// GET /api/messages/[conversationId] - Get messages for a conversation
export async function GET(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
	try {
		const session = await auth();
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = parseInt(session.user.id);
		const { conversationId: conversationIdStr } = await params;
		const conversationId = parseInt(conversationIdStr);

		if (isNaN(conversationId)) {
			return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
		}

		// Verify user is a participant in this conversation
		const participant = await prisma.conversationParticipant.findUnique({
			where: {
				userId_conversationId: {
					userId,
					conversationId,
				},
			},
		});

		if (!participant) {
			return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 });
		}

		// Get pagination params
		const { searchParams } = new URL(request.url);
		const cursor = searchParams.get('cursor');
		const limit = parseInt(searchParams.get('limit') || '50');

		// Fetch messages
		const messages = await prisma.message.findMany({
			where: {
				conversationId,
			},
			include: {
				sender: {
					select: {
						id: true,
						name: true,
						username: true,
						profileImage: true,
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
			take: limit + 1,
			...(cursor && {
				cursor: {
					id: parseInt(cursor),
				},
				skip: 1,
			}),
		});

		// Check if there are more messages
		let nextCursor: number | null = null;
		if (messages.length > limit) {
			const nextMessage = messages.pop();
			nextCursor = nextMessage!.id;
		}

		// Update last read timestamp
		await prisma.conversationParticipant.update({
			where: {
				userId_conversationId: {
					userId,
					conversationId,
				},
			},
			data: {
				lastReadAt: new Date(),
			},
		});

		return NextResponse.json({
			messages: messages.reverse(), // Return in chronological order
			nextCursor,
		});
	} catch (error) {
		console.error('Error fetching messages:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

// POST /api/messages/[conversationId] - Send a message
export async function POST(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
	try {
		const session = await auth();
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = parseInt(session.user.id);
		const { conversationId: conversationIdStr } = await params;
		const conversationId = parseInt(conversationIdStr);

		if (isNaN(conversationId)) {
			return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
		}

		const { content } = await request.json();

		if (!content || typeof content !== 'string' || content.trim().length === 0) {
			return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
		}

		if (content.length > 5000) {
			return NextResponse.json({ error: 'Message too long (max 5000 characters)' }, { status: 400 });
		}

		// Verify user is a participant
		const participant = await prisma.conversationParticipant.findUnique({
			where: {
				userId_conversationId: {
					userId,
					conversationId,
				},
			},
		});

		if (!participant) {
			return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 });
		}

		// Create the message
		const message = await prisma.message.create({
			data: {
				content: content.trim(),
				senderId: userId,
				conversationId,
			},
			include: {
				sender: {
					select: {
						id: true,
						name: true,
						username: true,
						profileImage: true,
					},
				},
			},
		});

		// Update conversation timestamp
		await prisma.conversation.update({
			where: { id: conversationId },
			data: { updatedAt: new Date() },
		});

		// Update sender's lastReadAt
		await prisma.conversationParticipant.update({
			where: {
				userId_conversationId: {
					userId,
					conversationId,
				},
			},
			data: {
				lastReadAt: new Date(),
			},
		});

		// Broadcast the message to the conversation channel via Pusher
		await pusherServer.trigger(`conversation-${conversationId}`, 'new-message', {
			message,
		});

		// Also notify each participant on their personal channel (for unread badge updates)
		const participants = await prisma.conversationParticipant.findMany({
			where: {
				conversationId,
				userId: { not: userId },
			},
		});

		for (const p of participants) {
			await pusherServer.trigger(`user-${p.userId}`, 'new-message-notification', {
				conversationId,
				message,
			});
		}

		return NextResponse.json(message);
	} catch (error) {
		console.error('Error sending message:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
