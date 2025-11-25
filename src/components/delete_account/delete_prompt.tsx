"use client";

import {Session} from "next-auth";
import {redirect} from "next/navigation";
import {signOut} from "next-auth/react";
import Link from "next/link";

export default function DeletePrompt({session}: {session: Session | null}) {
    const handleDelete = async () => {
        try {
            const response = await fetch("/api/user/delete", {
                method: "POST",
                headers: {"content-type": "application/json"},
                body: JSON.stringify({userId: session?.user?.id}),
            });
            if (!response.ok) throw new Error("Failed to delete user");

            let data = await response.json();
            data = data.message;

            console.log(data);

            signOut();
        } catch (err) {
            console.error("Delete Error: ", err);
            redirect("/");
        }
    };

    return (
        <>
            <div
                id="delete-prompt-container"
                className="flex flex-col items-center gap-3 text-center"
            >
                <div className="shadow-1xl font-bold border-1 rounded-full w-95 bg-red-400 p-2">
                    <button
                        className=""
                        onClick={handleDelete}
                    >
                        Delete {session?.user?.name}
                    </button>
                </div>
                <div className="border-1 rounded-full w-95 p-2 font-bold">
                    <Link href="/">Cancel</Link>
                </div>
            </div>
        </>
    );
}
