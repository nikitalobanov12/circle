import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function PATCH(
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

    // Check if the current user is the admin (creator)
    if (circle.creatorId !== userId) {
      return NextResponse.json({ error: 'Only the circle admin can promote members' }, { status: 403 });
    }

    // Check if the target user is a member
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

    // Check if the target user is already a moderator or admin
    if (targetMembership.role !== 'MEMBER') {
      return NextResponse.json({ error: 'User is already a moderator or admin' }, { status: 400 });
    }

    // Promote the member to moderator
    const updatedMembership = await prisma.membership.update({
      where: {
        userId_circleId: {
          userId: memberId,
          circleId,
        },
      },
      data: {
        role: 'MODERATOR',
      },
    });

    // Create an activity for the promoted user
    await prisma.activity.create({
      data: {
        type: 'circle_role_change',
        content: `You've been promoted to moderator in the circle "${circle.name}"`,
        userId: memberId,
        circleId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Member promoted to moderator successfully',
      membership: updatedMembership,
    });
  } catch (error) {
    console.error('Error promoting circle member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
