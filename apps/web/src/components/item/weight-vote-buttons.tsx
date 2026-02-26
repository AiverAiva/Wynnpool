"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Loader2, Check } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";

interface WeightFeedback {
  upvotes: number;
  downvotes: number;
  score: number;
  total: number;
  userVote: "upvote" | "downvote" | null;
}

interface Props {
  weightId: string;
  user: any;
}

export function WeightVoteButtons({ weightId, user }: Props) {
  const [feedback, setFeedback] = useState<WeightFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const isAuthenticated = !!user?.discordId;

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await fetch(api(`/item/weight/feedback/${weightId}`), {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setFeedback(data);
      }
    } catch (e) {
      console.error("Failed to fetch feedback:", e);
    } finally {
      setLoading(false);
    }
  }, [weightId]);

  useEffect(() => {
    fetchFeedback();
  }, [weightId, user?.discordId, fetchFeedback]);

  const handleVote = useCallback(
    async (vote: "upvote" | "downvote") => {
      if (!isAuthenticated || voting) return;
      setVoting(true);

      try {
        const res = await fetch(api(`/item/weight/feedback/${weightId}`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ vote }),
        });

        if (res.ok) {
          // Add a small delay to ensure backend has written the vote
          await new Promise((resolve) => setTimeout(resolve, 100));
          await fetchFeedback();
        }
      } catch (e) {
        console.error("Failed to vote:", e);
      } finally {
        setVoting(false);
      }
    },
    [isAuthenticated, voting, weightId, fetchFeedback]
  );

  if (loading) {
    return (
      <div className="flex items-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentVote = feedback?.userVote;
  const score = feedback?.score || 0;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-2 gap-1 ${
            currentVote === "upvote"
              ? "bg-green-500/10 text-green-500 border border-green-500/30"
              : "text-muted-foreground hover:text-green-500 hover:bg-green-500/5"
          } ${!isAuthenticated ? "cursor-not-allowed opacity-60" : ""}`}
          onClick={() => handleVote("upvote")}
          // disabled={voting || !isAuthenticated}
        >
          <ChevronUp className="h-4 w-4" />
          <span className="text-xs">{feedback?.upvotes || 0}</span>
        </Button>

        <span className={`text-sm font-semibold min-w-[28px] text-center ${
          score > 0 ? "text-green-500" : score < 0 ? "text-red-500" : "text-muted-foreground"
        }`}>
          {score}
        </span>

        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-2 gap-1 ${
            currentVote === "downvote"
              ? "bg-red-500/10 text-red-500 border border-red-500/30"
              : "text-muted-foreground hover:text-red-500 hover:bg-red-500/5"
          } ${!isAuthenticated ? "cursor-not-allowed opacity-60" : ""}`}
          onClick={() => handleVote("downvote")}
          // disabled={voting || !isAuthenticated}
        >
          <span className="text-xs">{feedback?.downvotes || 0}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
      {!isAuthenticated && (
        <Link 
          href={api("/auth/discord")} 
          className="text-xs text-blue-500 hover:underline cursor-pointer"
        >
          Login with Discord to vote
        </Link>
      )}
      {/* {isAuthenticated && currentVote && (
        <span className={`text-xs font-medium ${feedback?.downvotes ? "text-red-500" : "text-green-500"}`}>Voted</span>
      )} */}
    </div>
  );
}
