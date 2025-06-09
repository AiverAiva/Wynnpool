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
import { LogOut } from "lucide-react";
import api from "@/lib/api";

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
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{userName}</p>
                            <p className="text-xs leading-none text-muted-foreground">Discord User</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <div className="p-2">
                            <span>Coming Soon!</span>
                        </div>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                        window.location.href = api('/auth/logout');
                    }} className="text-red-500">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <Button
            onClick={() => {
                window.location.href = api("/auth/discord");
            }}
            variant="outline"
            className="flex items-center gap-1 dark:bg-background bg-[#5865F2] rounded-xl text-white hover:bg-[#4752c4] hover:text-white"
        >
            <span className="hidden sm:inline">Login with Discord</span>
            <span className="sm:hidden">Login</span>
        </Button>
    );
}
