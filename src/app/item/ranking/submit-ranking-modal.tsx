"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import api from "@/lib/api";

/**
 * Displays a modal dialog for submitting a verified item string and owner name.
 *
 * Allows users to input an item string and an optional owner name, then submit the data for verification and storage. Handles asynchronous API requests, displays loading and error states, and resets input fields upon successful submission.
 *
 * @param open - Whether the modal is visible
 * @param onClose - Callback to close the modal
 */
export default function SubmitRankingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [itemString, setItemString] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const summaryRes = await fetch(api("/item/decode/summary"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: itemString }),
      });

      if (!summaryRes.ok) throw new Error("Failed to decode item string.");

      const summary = await summaryRes.json();

      const result = await fetch(api("/item/database"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...summary,
          originalString: itemString,
          timestamp: Date.now(),
          owner: ownerName || "Unknown",
        }),
        credentials: "include",
      });

      if (!result.ok) throw new Error("Failed to store item.");

      onClose();
      setItemString("");
      setOwnerName("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Verified Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Paste item string..."
            value={itemString}
            onChange={(e) => setItemString(e.target.value)}
            disabled={loading}
          />
          <Input
            placeholder="Owner name..."
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            disabled={loading}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleSubmit} disabled={loading || !itemString || !ownerName}>
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
