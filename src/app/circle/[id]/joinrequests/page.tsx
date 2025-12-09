import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import CircleJoinRequests from '@/components/circle/CircleJoinRequests';
import NavBar from '@/components/bottom_bar/NavBar';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

interface PageParams {
	params: Promise<{
		id: string;
	}>;
}

export default async function CircleJoinRequestsPage(props: PageParams) {
    const params = await props.params;
    const session = await auth();

    if (!session?.user?.id) {
		redirect('/auth/login');
	}

    const { id: paramId } = params;
    const id = parseInt(paramId);
    if (isNaN(id)) {
		return notFound();
	}

    // Check if the circle exists and if the user has permission to see join requests
    const circle = await prisma.circle.findUnique({
		where: { id },
		select: {
			id: true,
			name: true,
			isPrivate: true,
			creatorId: true,
			members: {
				where: {
					userId: parseInt(session.user.id),
					role: {
						in: ['ADMIN', 'MODERATOR'],
					},
				},
				select: { role: true },
			},
		},
	});

    // Circle doesn't exist
    if (!circle) {
		return notFound();
	}

    // User doesn't have permission (not circle creator or not admin/moderator)
    const userId = parseInt(session.user.id);
    const isCreator = circle.creatorId === userId;
    const hasPermission = isCreator || circle.members.length > 0;

    if (!hasPermission) {
		redirect(`/circle/${id}`);
	}

    // Circle is not private
    if (!circle.isPrivate) {
		redirect(`/circle/${id}`);
	}

    return (
		<div className='min-h-screen pb-20 bg-[var(--background)]'>
			<div className='sticky top-0 z-10 bg-[var(--background)] py-4 px-4 mb-4 flex items-center'>
				<Link
					href={`/circle/${id}`}
					className='mr-4 p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors'
				>
					<FaArrowLeft size={18} />
				</Link>
				<span className='text-xl font-semibold'>Join Requests - {circle.name}</span>
			</div>

			<CircleJoinRequests circleId={id} />
			<NavBar />
		</div>
	);
}
