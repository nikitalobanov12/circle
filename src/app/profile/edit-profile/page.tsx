import EditProfileForm from '@/components/profile/EditProfileForm';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function EditProfilePage() {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="w-full max-w-xl mx-auto px-4 pt-6 pb-20">
        <h1 className="text-2xl font-bold text-[var(--primary)] mb-6">Edit Profile</h1>
        <EditProfileForm session={session} />
      </div>
    </div>
  );
}