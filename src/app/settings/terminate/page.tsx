import {auth} from "@/auth";
import {redirect} from "next/navigation";
import DeletePrompt from "@/components/delete_account/delete_prompt";

export default async function DeleteAccountPage() {
    const session = await auth();
    if (!session || !session.user) return redirect("/auth/login");

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="w-full max-w-xl mx-auto flex flex-col m-0 p-0">
                <div className="text-center my-20">
                    <h3 className="text-2xl font-extrabold">Are you sure you want to delete your Account?</h3>
                    <h3 className="text-s">(This will be gone forever)</h3>
                </div>
                <DeletePrompt session={session} />
            </div>
        </div>
    );
}
