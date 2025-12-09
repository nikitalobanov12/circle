import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string; memberId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const circleId = parseInt(params.id, 10);
    const memberId = parseInt(params.memberId, 10);

    if (isNaN(circleId) || isNaN(memberId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }

    // Check if the circle exists
    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
      select: {
        id: true,
        creatorId: true,
        name: true,
      },
    });

    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    // Cannot remove the circle creator
    if (memberId === circle.creatorId) {
      return NextResponse.json({ error: 'Cannot remove the circle creator' }, { status: 400 });
    }

    // Get the target user's membership
    const targetMembership = await prisma.membership.findUnique({
      where: {
        userId_circleId: {
          userId: memberId,
          circleId,
        },
      },
    });

    if (!targetMembership) {
      return NextResponse.json({ error: 'User is not a member of this circle' }, { status: 404 });
    }

    // Get the current user's role in the circle
    const currentUserMembership = await prisma.membership.findUnique({
      where: {
        userId_circleId: {
          userId,
          circleId,
        },
      },
    });

    // Check if the current user has permission to remove the target member
    const isAdmin = circle.creatorId === userId || currentUserMembership?.role === 'ADMIN';
    const isModerator = currentUserMembership?.role === 'MODERATOR';

    if (!isAdmin && (!isModerator || targetMembership.role !== 'MEMBER')) {
      return NextResponse.json({
        error: 'Insufficient permissions',
        details: 'Admins can remove any member, moderators can only remove regular members'
      }, { status: 403 });
    }

    // Remove the member
    await prisma.membership.delete({
      where: {
        userId_circleId: {
          userId: memberId,
          circleId,
        },
      },
    });

    // Create an activity for the removed user
    await prisma.activity.create({
      data: {
        type: 'circle_member_removed',
        content: `You have been removed from the circle "${circle.name}"`,
        userId: memberId,
        circleId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Member removed from circle successfully',
    });
  } catch (error) {
    console.error('Error removing circle member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
