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
import { RolledItemDisplay } from "@/components/wynncraft/item/RolledItemDisplay";
import {Checkbox} from "@/components/ui/checkbox";
import {Label} from "@/components/ui/label";

export default function SubmitRankingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [itemString, setItemString] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ironman, setIronman] = useState(false);
  const [verified, setVerified] = useState(false);

  const [loading, setLoading] = useState(false);
  type SubmissionError = 'DECODE_FAILED' | 'STORE_FAILED' | 'NETWORK_ERROR';
  const [error, setError] = useState<SubmissionError | null | string>(null);
  const [decodedData, setDecodedData] = useState<any>(null);


  // Decode item string when changed and not empty
  const handleItemStringChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setItemString(value);
    setDecodedData(null);
    setError(null);
    const trimmed = value.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const decodeRes = await fetch(api("/item/full-decode/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: trimmed }),
      });
      if (!decodeRes.ok) {
        const errorText = await decodeRes.text();
        throw new Error(`Failed to decode item string: ${errorText}`);
      }
      const decodeJson = await decodeRes.json();
      setDecodedData(decodeJson);
    } catch (err: any) {
      setError(err.message);
      setDecodedData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Client-side validation
    const trimmedItemString = itemString.trim();
    if (!trimmedItemString) {
      setError("Item string is required");
      return;
    }
    const trimmedOwnerName = ownerName.trim();
    if (!trimmedOwnerName) {
      setError("Owner name is required");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Use already-decoded data if available
      let summary = decodedData?.input;
      if (!summary) {
        const decodeRes = await fetch(api("/item/full-decode/"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item: trimmedItemString }),
        });
        if (!decodeRes.ok) {
          const errorText = await decodeRes.text();
          throw new Error(`Failed to decode item string: ${errorText}`);
        }
        const decodeJson = await decodeRes.json();
        summary = decodeJson.input;
      }

      const result = await fetch(api("/item/database"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...summary,
          originalString: trimmedItemString,
          timestamp: Date.now(),
          owner: trimmedOwnerName || "Unknown",
          ironman,
          verified,
        }),
        credentials: "include",
      });

      if (!result.ok) throw new Error("Failed to store item.");

      onClose();
      setItemString("");
      setOwnerName("");
      setIronman(false);
      setVerified(false);
      setDecodedData(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Submit Verified Item</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col md:flex-row gap-6 items-stretch h-full">
          <div
            className="min-h-[300px] w-full md:w-[340px] flex items-center justify-center rounded-md border bg-background mx-auto"
          >
            {loading ? (
              <span className="text-sm text-muted-foreground animate-pulse">Loading preview...</span>
            ) : decodedData ? (
              <RolledItemDisplay data={decodedData} withCard={false} />
            ) : (
              <span className="text-sm text-muted-foreground">Item preview will appear here</span>
            )}
          </div>
          <div className="flex flex-col flex-1 h-full justify-between">
            <div className="flex flex-col gap-3">
              <Input
                className="w-full"
                placeholder="Paste item string..."
                value={itemString}
                onChange={handleItemStringChange}
                disabled={loading}
              />
              <Input
                className="w-full"
                placeholder="Owner name..."
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                disabled={loading}
              />
              <div>
                <div>
                  <Checkbox
                    checked={ironman}
                    onCheckedChange={(checked) => setIronman(!!checked)}
                    disabled={loading}/>
                  <Label className="pl-1">Is Ironman</Label>
                </div>
                <div>
                  <Checkbox
                    checked={verified}
                    onCheckedChange={(checked) => setVerified(!!checked)}
                    disabled={loading}/>
                  <Label className="pl-1">Verified in-game</Label>
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="flex justify-end mt-4">
              <Button className="w-fit" onClick={handleSubmit} disabled={loading || !itemString || !ownerName}>
                {loading ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
