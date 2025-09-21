"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Helper to fetch user info from the new API endpoint
async function fetchUser() {
    try {
        const res = await fetch(api("/user/me/quick"), { credentials: "include" });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export default function UserAuthDisplay() {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    // add router hook for client-side navigation
    const router = useRouter();

    useEffect(() => {
        fetchUser().then((u) => {
            setUser(u && u.discordId ? u : null);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            </div>
        );
    }

    if (user) {
        const userName = user.discordProfile?.global_name || user.discordProfile?.username || "User";
        const avatarUrl = user.discordProfile?.avatar
            ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordProfile.avatar}.png`
            : undefined;
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={avatarUrl} alt={userName} />
                            <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="p-2 z-50 space-y-2 min-w-[220px] bg-background rounded-md shadow-md overflow-y-auto w-[280px]" align="end" forceMount>
                    <DropdownMenuGroup className="space-y-2">
                        <div className="flex flex-col space-y-3 items-center justify-center relative bg-accent pt-7 pb-5 rounded-md">
                            <div className="relative">
                                <span className="inline-block rounded-full overflow-hidden">
                                    <Avatar className="w-12 h-12 rounded-xl">
                                        <AvatarImage src={avatarUrl} alt={userName} />
                                        <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </span>
                            </div>
                            <div className="flex flex-col items-center justify-center">
                                <p className="text-sm font-medium">{userName}</p>
                                <p className="text-xs text-muted-foreground">Wynnpool User</p>
                            </div>
                        </div>
                        <DropdownMenuItem onClick={() => router.push("/profile")}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Account Settings</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    {/* <DropdownMenuSeparator /> */}
                    {/* <DropdownMenuGroup>
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup> */}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={async () => {
                        await fetch(api('/auth/logout'), { credentials: 'include' });
                        setUser(null);
                        window.location.reload();
                    }} className="text-red-500">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <Link href={api("/auth/discord")} prefetch={false}>
            <Button
                // onClick={() => {
                //     window.location.href = api("/auth/discord");
                // }}
                variant="outline"
                className="flex items-center gap-1 dark:bg-background bg-[#5865F2] rounded-xl text-white hover:bg-[#4752c4] hover:text-white"
            >
                <span className="hidden sm:inline">Login with Discord</span>
                <span className="sm:hidden">Login</span>
            </Button>
        </Link>
    );
}
