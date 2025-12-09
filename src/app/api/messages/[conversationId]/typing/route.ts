import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import pusherServer from '@/lib/pusher-server';

// POST /api/messages/[conversationId]/typing - Send typing indicator
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

		const { isTyping } = await request.json();

		// Verify user is a participant
		const participant = await prisma.conversationParticipant.findUnique({
			where: {
				userId_conversationId: {
					userId,
					conversationId,
				},
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						username: true,
					},
				},
			},
		});

		if (!participant) {
			return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 });
		}

		// Broadcast typing status
		await pusherServer.trigger(`conversation-${conversationId}`, 'typing', {
			user: participant.user,
			isTyping: !!isTyping,
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error sending typing indicator:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
