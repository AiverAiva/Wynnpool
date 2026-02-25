"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar,
    Gift,
    Megaphone,
    FileText,
    X,
    Heart,
    Clock,
    Loader2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { remarkWynnMuted } from "@/lib/markdown/wynn-remark";
import api from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// --- Types & Helpers ---
interface ArticleSummary {
    pk: number; title: string; type: "blog" | "event" | "giveaway";
    banner: string; recap: string; published_at: string;
}
interface ArticleDetail {
    id: number; created_by: string; title: string; banner: string;
    recap: string; likes: number; published_at: string;
    content: Array<{ id: string; type: string; content: string; website: boolean; }>;
}
const getCDNUrl = (path: string) => `https://cdn.wynncraft.com/nextgen/${path}`;
const formatDate = (isoString: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(isoString));
const getTypeStyle = (type: string) => {
    switch (type) {
        case "giveaway": return { icon: Gift, color: "from-fuchsia-500 to-pink-500", text: "text-pink-300" };
        case "event": return { icon: Megaphone, color: "from-amber-500 to-orange-500", text: "text-amber-300" };
        default: return { icon: FileText, color: "from-blue-500 to-cyan-500", text: "text-cyan-300" };
    }
};

export default function WynnPublisher() {
    const [articles, setArticles] = useState<ArticleSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [detail, setDetail] = useState<ArticleDetail | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    // Lock background scroll
    useEffect(() => {
        if (selectedId) {
            document.body.style.overflow = 'hidden';
            // Mobile usually doesn't need padding-right compensation, but desktop does
            if (window.innerWidth > 768) {
                const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
                document.body.style.paddingRight = `${scrollBarWidth}px`;
            }
        } else {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        }
    }, [selectedId]);

    // Fetch List
    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const res = await fetch(api("/wynncraft/articles/list/article"));
                const data = await res.json();
                if (data?.results) setArticles(Object.values(data.results) as ArticleSummary[]);
            } catch (err) { console.error(err); } finally { setIsLoading(false); }
        };
        fetchArticles();
    }, []);

    useEffect(() => {
        if (!selectedId) return;
        const fetchDetail = async () => {
            setIsDetailLoading(true);
            try {
                const res = await fetch(api(`/wynncraft/articles/fetch/article/${selectedId}`));
                const data = await res.json();
                setDetail(data);
            } catch (err) { console.error(err); } finally { setIsDetailLoading(false); }
        };
        fetchDetail();
    }, [selectedId]);

    const handleCloseModal = () => {
        setSelectedId(null);
        setTimeout(() => setDetail(null), 400);
    };

    return (
        <div className="w-full">
            {/* Grid List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[400px] rounded-2xl bg-white/5 animate-pulse border border-white/10" />)
                ) : (
                    articles.map((article) => {
                        const style = getTypeStyle(article.type);
                        return (
                            <motion.div
                                key={article.pk}
                                layoutId={`card-${article.pk}`}
                                onClick={() => setSelectedId(article.pk)}
                                className="group relative cursor-pointer"
                                whileHover={{ y: -5 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className={`absolute -inset-0.5 bg-gradient-to-br ${style.color} rounded-2xl opacity-0 group-hover:opacity-20 blur-md transition duration-500`} />
                                <div className="relative h-full flex flex-col bg-background/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                                    <div className="relative h-48 overflow-hidden bg-black">
                                        <motion.img
                                            layoutId={`img-${article.pk}`}
                                            src={getCDNUrl(article.banner)}
                                            className="w-full h-full object-cover scale-[1.02]"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                                    </div>
                                    <div className="p-5 flex flex-col flex-grow">
                                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                                            <style.icon className={`w-3 h-3 ${style.text}`} />
                                            <span className={style.text}>{article.type}</span>
                                            <span>•</span> <span>{formatDate(article.published_at)}</span>
                                        </div>
                                        <motion.h3 layoutId={`title-${article.pk}`} className="text-lg font-bold line-clamp-2">{article.title}</motion.h3>
                                        <p className="text-sm text-muted-foreground line-clamp-3 opacity-80">{article.recap}</p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Modal - 深度優化手機版與防漏光 */}
            <AnimatePresence>
                {selectedId && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />

                        <motion.div
                            layoutId={`card-${selectedId}`}
                            // Mobile: h-full, Desktop: h-[90vh]. Use flex-col to prevent overflow
                            className="relative z-[110] w-full max-w-5xl h-[100dvh] sm:h-[90vh] bg-background sm:border sm:border-border sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                        >
                            <button onClick={handleCloseModal} className="absolute top-4 right-4 z-[130] p-2 bg-muted/40 hover:bg-accent backdrop-blur-md rounded-full border border-border text-muted-foreground">
                                <X className="w-6 h-6" />
                            </button>
                            {isDetailLoading || !detail ? (
                                <div className="flex-grow flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                    <p className="text-xs font-medium text-white/30 uppercase tracking-widest">Fetching Intel</p>
                                </div>
                            ) : (
                                <ScrollArea className="flex-grow w-full overflow-x-hidden overscroll-contain" onWheel={(e) => {
                                    const element = e.currentTarget as HTMLDivElement;
                                    const isAtTop = element.scrollTop === 0;
                                    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 1;
                                    if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                                        e.preventDefault();
                                    }
                                }}>
                                    {/* Banner Section */}
                                    <div className="relative w-full h-[35vh] sm:h-[450px] bg-black">
                                        <motion.img
                                            layoutId={`img-${selectedId}`}
                                            src={getCDNUrl(detail.banner)}
                                            className="w-full h-full object-cover scale-[1.05] will-change-transform"
                                        />

                                        {/* Prevent Light Leak 1: Heavy gradient at bottom */}
                                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />

                                        {/* Prevent Light Leak 2: Inner shadow at edges to prevent anti-aliasing color bleed from bright images */}
                                        <div className="absolute inset-0 shadow-[inset_0_0_2px_rgba(255,255,255,0.1),inset_0_-2px_10px_0px_hsl(var(--background))] z-15" />

                                        <div className="absolute bottom-0 left-0 w-full p-6 sm:p-12 z-20">
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/70">
                                                <div className="flex items-center gap-2 bg-muted/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-border">
                                                    <span className="font-medium text-foreground">{detail.created_by}</span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-muted/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-border">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4" />
                                                        {formatDate(detail.published_at)}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 bg-muted/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-border">
                                                    {detail.likes > 0 && (
                                                        <div className="flex items-center gap-1.5 text-pink-400">
                                                            <Heart className="w-4 h-4 fill-pink-500/20" />
                                                            {detail.likes}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <motion.h1
                                                layoutId={`title-${selectedId}`}
                                                className="text-2xl sm:text-5xl md:text-6xl font-black text-foreground leading-tight sm:leading-[0.9] tracking-tighter"
                                            >
                                                {detail.title}
                                            </motion.h1>
                                        </div>
                                    </div>

                                    {/* Content Section: Use negative margin overlay and limit max width to prevent viewport overflow */}
                                    <div className="relative z-30 bg-background -mt-2 px-4 sm:px-12 md:px-24 py-12 pb-32">
                                        <div className="max-w-3xl mx-auto w-full">
                                            <p className="text-base sm:text-lg text-muted-foreground font-medium leading-relaxed italic border-l-4 border-indigo-500 pl-4 sm:pl-6 mb-10">
                                                {detail.recap}
                                            </p>

                                            {/* Markdown Rendering: Adjust font size for mobile and ensure no overflow */}
                                            <article className="prose prose-indigo dark:prose-invert max-w-none 
                                                prose-p:text-foreground/80 prose-p:leading-relaxed prose-p:text-sm sm:prose-p:text-base
                                                prose-headings:font-black prose-headings:tracking-tighter
                                                prose-headings:text-base sm:prose-headings:text-xl
                                                prose-img:rounded-xl prose-img:w-full prose-img:object-cover prose-img:max-w-full
                                                prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:overflow-x-auto
                                                prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:break-words
                                                prose-table:overflow-x-auto prose-table:block
                                                prose-li:text-foreground/80 prose-li:text-sm sm:prose-li:text-base
                                                overflow-x-hidden">
                                                {detail.content
                                                    .filter(s => s.website)
                                                    .map(section => {
                                                        // Handle image type
                                                        if (section.type === "image" && Array.isArray(section.content)) {
                                                            return (
                                                                <div key={section.id} className="my-6 space-y-3">
                                                                    {section.content.map((imgPath: string, imgIdx: number) => (
                                                                        <motion.img
                                                                            key={`${section.id}-${imgIdx}`}
                                                                            layoutId={`img-${selectedId}-content-${section.id}-${imgIdx}`}
                                                                            src={getCDNUrl(imgPath)}
                                                                            className="w-full rounded-xl border border-border"
                                                                            loading="lazy"
                                                                            initial={{ opacity: 0 }}
                                                                            animate={{ opacity: 1 }}
                                                                            transition={{ duration: 0.3 }}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            );
                                                        }
                                                        // Handle text type
                                                        if (section.type === "text") {
                                                            return (
                                                                <ReactMarkdown 
                                                                    key={section.id}
                                                                    remarkPlugins={[remarkWynnMuted]}
                                                                    components={{
                                                                        // Custom renderer for wynnMuted nodes
                                                                        wynnMuted: ({ children }: { children: React.ReactNode }) => (
                                                                            <p className="text-xs text-muted-foreground font-medium italic my-2">
                                                                                {children}
                                                                            </p>
                                                                        ),
                                                                    } as any}
                                                                >
                                                                    {section.content}
                                                                </ReactMarkdown>
                                                            );
                                                        }
                                                        return null;
                                                    })
                                                }
                                            </article>
                                        </div>
                                    </div>
                                </ScrollArea>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}