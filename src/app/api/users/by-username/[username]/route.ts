import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: NextRequest, props: { params: Promise<{ username: string }> }) {
  const params = await props.params;
  try {
    const username = params.username;
    const session = await auth();
    const currentUserId = session?.user?.id ? parseInt(session.user.id as string) : null;

    // Find the user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        email: true, 
        name: true,
        username: true,
        bio: true,
        profileImage: true,
        coverImage: true,
        isProfilePrivate: true,
        followers: { select: { followerId: true } },
        following: { select: { followingId: true } },
        _count: {
          select: {
            createdCircles: true,
            Album: true,
            followers: true,
            following: true,
          },
        },
      },
    });    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }    // Check if this is the user's own profile
    const isOwnProfile = currentUserId === user.id;
    
    // Check if current user is following this user
    const isFollowing = currentUserId 
      ? user.followers.some(follower => follower.followerId === currentUserId)
      : false;
    
    // For private profiles, limit data if not following and not own profile
    if (user.isProfilePrivate && !isFollowing && !isOwnProfile) {
      // Return limited profile data
      return NextResponse.json({
        id: user.id,
        name: user.name,
        username: user.username,
        profileImage: user.profileImage,
        isProfilePrivate: true,
        circlesCount: 0,
        albumsCount: 0,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        isFollowing: false,
        isOwnProfile: false
      });
    }
      
    // Prepare the response data
    const publicUserData = {
      id: user.id,
      name: user.name,
      username: user.username,
      bio: user.bio,
      profileImage: user.profileImage,
      coverImage: user.coverImage,
      isProfilePrivate: user.isProfilePrivate,
      circlesCount: user._count.createdCircles,
      albumsCount: user._count.Album,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      isOwnProfile: currentUserId === user.id,
      isFollowing: isFollowing,
      // Only include email if it's the user's own profile
      email: currentUserId === user.id ? user.email : undefined,
    };

    return NextResponse.json(publicUserData);
  } catch (error) {
    console.error('Error fetching user by username:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}
