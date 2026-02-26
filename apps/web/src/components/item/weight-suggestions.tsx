"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Trash2 } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";

interface Suggestion {
  _id: string;
  weight_id: string;
  discord_id: string | null;
  content: string;
  anonymous: boolean;
  discord_username: string;
  discord_avatar: string | null;
  created_at: number;
}

interface UserSuggestion extends Suggestion {
  canDelete: boolean;
}

interface Props {
  weightId: string;
  user: any;
}

function getDiscordAvatarUrl(avatar: string | null, discordId: string | null): string | null {
  if (!avatar || !discordId) return null;
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png?size=32`;
}

export function WeightSuggestions({ weightId, user }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [userSuggestion, setUserSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const isAuthenticated = !!user?.discordId;

  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await fetch(api(`/item/weight/suggestions/${weightId}`), {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setUserSuggestion(data.userSuggestion || null);
      }
    } catch (e) {
      console.error("Failed to fetch suggestions:", e);
    } finally {
      setLoading(false);
    }
  }, [weightId]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleSubmit = async () => {
    if (!isAuthenticated || !content.trim() || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch(api(`/item/weight/suggestions/${weightId}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: content.trim(), anonymous }),
      });

      if (res.ok) {
        await fetchSuggestions();
        setContent("");
        setAnonymous(false);
      } else {
        const error = await res.json().catch(() => ({}));
        alert(error.message || "Failed to submit suggestion");
      }
    } catch (e) {
      console.error("Failed to submit suggestion:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (suggestionId: string) => {
    if (!confirm("Delete this suggestion?")) return;

    try {
      const res = await fetch(api(`/item/weight/suggestions/${weightId}/${suggestionId}`), {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        await fetchSuggestions();
      }
    } catch (e) {
      console.error("Failed to delete suggestion:", e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Suggestions</h3>
        <span className="text-xs text-muted-foreground">{suggestions.length} total</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No suggestions yet.</p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {suggestions.map((suggestion) => {
                const isOwnSuggestion = userSuggestion?._id === suggestion._id;
                const avatarUrl = suggestion.anonymous
                  ? null
                  : getDiscordAvatarUrl(suggestion.discord_avatar, suggestion.discord_id);

                return (
                  <div
                    key={suggestion._id}
                    className="border border-border bg-background/60 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={suggestion.discord_username}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">?</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {suggestion.discord_username}
                          </span>
                          {suggestion.anonymous && (
                            <span className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                              anon
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground mt-1 break-words">{suggestion.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(suggestion.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {isOwnSuggestion && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(suggestion._id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {isAuthenticated ? (
            <div className="space-y-3 pt-2 border-t">
              {userSuggestion ? (
                <div className="text-sm text-muted-foreground">
                  You have already submitted a suggestion. Edit it above or delete to submit a new one.
                </div>
              ) : (
                <>
                  <Textarea
                    placeholder="Share your suggestion..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[80px] resize-none"
                    maxLength={1000}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="anonymous"
                        checked={anonymous}
                        onCheckedChange={(checked) => setAnonymous(checked === true)}
                      />
                      <Label htmlFor="anonymous" className="text-xs cursor-pointer">
                        Post anonymously
                      </Label>
                    </div>
                    <Button
                      size="sm"
                      disabled={!content.trim() || submitting}
                      onClick={handleSubmit}
                    >
                      {submitting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                      <span className="ml-1.5">Submit</span>
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="pt-2 border-t text-center">
              <Link
                href={api("/auth/discord")}
                className="text-sm text-blue-500 hover:underline"
              >
                Login with Discord to add a suggestion
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
