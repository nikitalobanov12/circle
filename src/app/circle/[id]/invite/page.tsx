import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import CircleInvitation from '@/components/circle/CircleInvitation';
import { FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import prisma from '@/lib/prisma';

export default async function CircleInvitePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id) {
		redirect('/auth/login?callbackUrl=/circle');
	}
    const id = await params.id
    const circleId = parseInt(id, 10);
    if (isNaN(circleId)) {
		redirect('/profile');
	}

    const userId = parseInt(session.user.id, 10);

    const circle = await prisma.circle.findUnique({
		where: { id: circleId },
		select: {
			id: true,
			name: true,
			creatorId: true,
			members: {
				where: { userId },
				select: { role: true },
			},
		},
	});

    if (!circle) {
		redirect('/profile');
	}

    return (
		<div className='min-h-screen pb-20 bg-[var(--background)]  text-[var(--foreground)]'>
			<div className='sticky top-0 z-10 bg-[var(--background)] py-4 px-4 mb-4'>
				<div className='flex items-center'>
					<Link
						href={`/circle/${circleId}`}
						className='mr-4 p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors'
					>
						<FaArrowLeft size={18} />
					</Link>
					<span className='text-xl font-semibold'>Invite to {circle.name}</span>
				</div>
			</div>

			<CircleInvitation circleId={circleId} />
		</div>
	);
}
