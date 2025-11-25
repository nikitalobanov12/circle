import CircleInvites from "@/components/activity/CircleInvites";
import NavBar from "@/components/bottom_bar/NavBar";

export default function CircleInvitesPage() {
    return (
        <>
            <div className="min-h-screen bg-[var(--background)]">
                <div className="w-full max-w-xl mx-auto px-4 pt-6 pb-20">
                    <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">Circle Invites</h1>
                    <CircleInvites />
                </div>
            </div>
            <NavBar />
        </>
    );
}
