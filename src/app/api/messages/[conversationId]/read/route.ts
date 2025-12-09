import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import pusherServer from '@/lib/pusher-server';

// POST /api/messages/[conversationId]/read - Mark conversation as read
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

		// Update last read timestamp
		const participant = await prisma.conversationParticipant.update({
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

		// Notify other participants that this user has read messages
		await pusherServer.trigger(`conversation-${conversationId}`, 'messages-read', {
			userId,
			readAt: participant.lastReadAt,
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error marking messages as read:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
