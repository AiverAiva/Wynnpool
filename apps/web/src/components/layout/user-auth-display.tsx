"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, Shield, Sparkles } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

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
                <div className="h-9 w-9 rounded-full bg-muted/50 animate-pulse border border-border/50" />
            </div>
        );
    }

    if (user) {
        const userName = user.discordProfile?.global_name || user.discordProfile?.username || "User";
        const discordTag = user.discordProfile?.username || "";
        const avatarUrl = user.discordProfile?.avatar
            ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordProfile.avatar}.png`
            : undefined;

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative group focus:outline-none"
                    >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-0 group-hover:opacity-70 blur transition duration-300" />
                        <div className="relative flex items-center justify-center size-9 rounded-full bg-background border border-border group-hover:border-transparent transition-colors overflow-hidden">
                            <Avatar className="size-8">
                                <AvatarImage src={avatarUrl} alt={userName} className="object-cover" />
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-500 font-bold">
                                    {userName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </motion.button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    className="p-1.5 z-50 min-w-[240px] bg-background/60 shadow-[0_8px_32px_0_rgba(31,38,31,0.37)] backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl overflow-hidden"
                    // shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] 
                    align="end"
                    sideOffset={8}
                >
                    <div className="relative px-3 py-4 mb-1.5 overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent border border-white/10">
                        <div className="absolute top-0 right-0 p-2 opacity-20">
                            <Sparkles className="size-12 text-indigo-500 rotate-12" />
                        </div>

                        <div className="flex items-center gap-3 relative z-10">
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full blur-[2px] opacity-50" />
                                <Avatar className="size-12 border-2 border-background rounded-full shadow-sm">
                                    <AvatarImage src={avatarUrl} alt={userName} />
                                    <AvatarFallback className="bg-muted text-sm font-bold">{userName.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold truncate tracking-tight">{userName}</span>
                                <span className="text-[10px] text-muted-foreground truncate opacity-80">@{discordTag}</span>
                                {/* <div className="mt-1 flex items-center">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                        <Shield className="size-2 mr-1" />
                                        MEMBER
                                    </span>
                                </div> */}
                            </div>
                        </div>
                    </div>

                    <DropdownMenuGroup className="space-y-0.5">
                        <DropdownMenuItem
                            onClick={() => router.push("/profile")}
                            className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg transition-colors hover:bg-white/10 focus:bg-indigo-500/20 focus:text-indigo-500 group"
                        >
                            <User className="size-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                            <span className="text-sm font-medium">My Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => router.push("/settings")}
                            className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg transition-colors hover:bg-white/10 focus:bg-indigo-500/20 focus:text-indigo-500 group"
                        >
                            <Settings className="size-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                            <span className="text-sm font-medium">Settings</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator className="my-1.5 bg-white/10" />

                    <DropdownMenuItem
                        onClick={async () => {
                            await fetch(api('/auth/logout'), { credentials: 'include' });
                            setUser(null);
                            window.location.reload();
                        }}
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg transition-colors hover:bg-red-500/10 focus:bg-red-500/20 focus:text-red-500 group text-red-500/80"
                    >
                        <LogOut className="size-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                        <span className="text-sm font-medium">Sign Out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <Link href={api("/auth/discord")} prefetch={false} className="relative group">
            <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
            >
                <Button
                    variant="ghost"
                    className="relative overflow-hidden flex items-center gap-2 px-5 py-2 h-10 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white border-none transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 group"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.086 2.157 2.419c0 1.334-.947 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.086 2.157 2.419c0 1.334-.946 2.419-2.157 2.419z" />
                    </svg>
                    <span className="tracking-tight text-sm hidden sm:inline">Login with Discord</span>
                    <span className="tracking-tight text-sm sm:hidden">Login</span>
                </Button>
            </motion.div>
        </Link>
    );
}
