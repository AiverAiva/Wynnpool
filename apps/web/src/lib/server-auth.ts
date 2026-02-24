import { cookies } from "next/headers";
import api from "./api";

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const cookieName = process.env.NODE_ENV === 'production'
        ? '__Secure-wynnpool.session-token'
        : 'wynnpool.session-token';
    
    const token = cookieStore.get(cookieName);

    if (!token) {
        return null;
    }

    try {
        // Backend internal URL or accessible URL from server
        // Using the same api() helper but ensure it points to the correct host for server-side
        const res = await fetch(api("/user/me/quick"), {
            headers: {
                Cookie: cookieStore.toString(),
            },
            cache: "no-store",
        });

        if (!res.ok) {
            return null;
        }

        const user = await res.json();
        return user && user.discordId ? user : null;
    } catch (error) {
        console.error("Error fetching user on server:", error);
        return null;
    }
}
