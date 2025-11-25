"use client";
import SettingsCategory from "@/components/settings_form/SettingsCategory";
import SettingsItem from "@/components/settings_form/SettingsItem";
import {FaBell, FaUserFriends, FaAdjust, FaImages, FaSignOutAlt, FaTrash} from "react-icons/fa";
import {signOut} from "next-auth/react";
import NavBar from "@/components/bottom_bar/NavBar";
// import DemoNavBar from '@/components/top_nav/DemoNavBar';

export default function SettingsPage() {
    return (
        <>
            <div className="min-h-screen bg-[var(--background)]">
                <div className="w-full max-w-xl mx-auto p-6 mb-10">
                    {/* <DemoNavBar /> */}
                    <header className="mb-6">
                        <h1 className="text-3xl font-bold">Settings</h1>
                    </header>

                    <SettingsCategory title="Albums">
                        <SettingsItem
                            label="Privacy"
                            icon={<FaImages />}
                            href="/settings/albums"
                        />
                        <SettingsItem
                            label="Notification"
                            icon={<FaBell />}
                            href="/settings/albums"
                        />
                    </SettingsCategory>

                    <SettingsCategory title="Accessibility">
                        <SettingsItem
                            label="Dark / Light Mode"
                            icon={<FaAdjust />}
                            href="/settings/accessibility"
                        />
                        <SettingsItem
                            label="Contrast"
                            icon={<FaAdjust />}
                            href="/settings/accessibility"
                        />
                        <SettingsItem
                            label="Font Size"
                            icon={<FaAdjust />}
                            href="/settings/accessibility"
                        />
                    </SettingsCategory>

                    <SettingsCategory title="Account">
                        <SettingsItem
                            label="Friends List"
                            icon={<FaUserFriends />}
                            href="/settings/friends"
                        />
                        <SettingsItem
                            customColour="red"
                            label="Delete Account"
                            icon={<FaTrash />}
                            href="/settings/terminate"
                        />
                        <SettingsItem
                            label="Logout"
                            icon={<FaSignOutAlt />}
                            onClick={async () => {
                                await signOut({redirectTo: "/auth/login"});
                            }}
                        />
                    </SettingsCategory>
                </div>
            </div>
            <NavBar />
        </>
    );
}
