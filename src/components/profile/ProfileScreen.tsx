"use client";

import { useEffect, useState, useCallback } from "react";
import { Session } from "next-auth";
import ProfileHeader from "./ProfileHeader";
import ProfileTabs from "./ProfileTabs";

interface User {
    id: number;
    name: string;
    username: string;
    profileImage: string;
    bio: string;
    circleCount: number;
    friendCount: number;
}

interface ProfileUser {
    id: number;
    username: string;
    name?: string | null;
    bio?: string | null;
    profileImage?: string | null;
    coverImage?: string | null;
    isProfilePrivate?: boolean;
    circlesCount: number;
    albumsCount: number;
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
    isOwnProfile: boolean;
}

interface ProfileScreenProps {
    session: Session | null;
    username?: string;
}

export default function ProfileScreen({ session, username }: ProfileScreenProps) {
    const [user, setUser] = useState<User | null>(null);
    const [profileData, setProfileData] = useState<ProfileUser | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUserData = useCallback(async () => {
        if (!session?.user?.id && !username) {
            setLoading(false);
            return;
        }

        try {
            setError(null);
            const endpoint = username 
                ? `/api/users/by-username/${encodeURIComponent(username)}`
                : `/api/users/${session?.user?.id}`;
            
            const res = await fetch(endpoint);
            
            if (!res.ok) {
                throw new Error(`Failed to fetch user data: ${res.status}`);
            }
            
            const data = await res.json();
            setUser(data);
            
            if (data) {
                const isOwnProfile = session?.user?.id === String(data.id) || 
                                    session?.user?.id === data.id;
                
                setProfileData({
                    id: data.id,
                    username: data.username,
                    name: data.name,
                    bio: data.bio,
                    profileImage: data.profileImage,
                    coverImage: data.coverImage,
                    isProfilePrivate: data.isProfilePrivate,
                    circlesCount: data.circlesCount || 0,
                    albumsCount: data.albumsCount || 0,
                    followersCount: data.followersCount || 0,
                    followingCount: data.followingCount || 0,
                    isFollowing: data.isFollowing || false,
                    isOwnProfile: isOwnProfile
                });
            }
        } catch (error) {
            console.error("Failed to fetch user data:", error);
            setError("Failed to load profile data");
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id, username]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    if (loading) return <p className="text-center text-circles-light">Loading...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;
    if (!user && !session) return <p className="text-center text-circles-light">Please login to view profiles</p>;
    if (!user) return <p className="text-center text-circles-light">User not found</p>;

    const handleFollowUpdate = (isFollowing: boolean) => {
        // Update local state when follow status changes
        setProfileData(prev => prev ? {
            ...prev,
            isFollowing,
            followersCount: isFollowing ? 
                prev.followersCount + 1 : 
                Math.max(0, prev.followersCount - 1)
        } : undefined);
    };

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="w-full max-w-xl mx-auto px-4 pt-6 pb-20">
                <ProfileHeader 
                    profileData={profileData} 
                    session={session} 
                    onFollowUpdate={handleFollowUpdate}
                />
                {/* ProfileTabs doesn't need any props */}
                <ProfileTabs />
            </div>
        </div>
    );
}
