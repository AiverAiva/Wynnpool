"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect, useState, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ItemIcon } from "@/components/custom/WynnIcon";
import { WeightVoteButtons } from "@/components/item/weight-vote-buttons";
import api from "@/lib/api";

// Use the Item type from the shared types to match ItemIcon's expectations
import type { Item } from "@wynnpool/shared";

interface Weight {
  _id?: string;
  item_name: string;
  item_id: string;
  weight_name: string;
  weight_id: string;
  description?: string;
  type: string;
  author: string;
  timestamp: number;
  identifications: Record<string, number>;
}

interface Props {
  item: Item;
  open: boolean;
  onClose: () => void;
  user: any;
  isAllowed: boolean;
}

const STATIC_IDS = [
  "rawStrength",
  "rawDexterity",
  "rawAgility",
  "rawDefence",
  "rawIntelligence",
];

export default function ItemModal({ item, open, onClose, user, isAllowed }: Props) {
  const [weights, setWeights] = useState<Weight[]>([]);
  const [editableWeight, setEditableWeight] = useState<Weight | null>(null);
  const [isLoadingWeight, setIsLoadingWeight] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const lastFetched = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !item?.internalName) return;
    if (lastFetched.current === item.internalName) return;
    lastFetched.current = item.internalName;
    setIsLoadingWeight(true); // start loading
    fetch(api(`/item/${item.internalName}/weight`))
      .then((res) => res.json())
      .then((data) => setWeights(data))
      .catch(console.error)
      .finally(() => setIsLoadingWeight(false)); // stop loading
  }, [item, open]);

  const handleChangeWeight = (id: string, value: number) => {
    if (!editableWeight) return;
    setEditableWeight({
      ...editableWeight,
      identifications: {
        ...editableWeight.identifications,
        [id]: value,
      },
    });
  };

  const handleSubmit = async () => {
    if (!editableWeight || !isAllowed) return;
    setSubmitting(true);
    // 🔍 Filter identifications that are not zero
    const filteredIdentifications = Object.fromEntries(
      Object.entries(editableWeight.identifications)
      // .filter(([, val]) => val > 0)
    );

    const payload = {
      ...editableWeight,
      identifications: filteredIdentifications, // ✅ use filtered
      userId: user.discordId,
    };

    const method = weights.find((w) => w.weight_id === editableWeight.weight_id)
      ? "PATCH"
      : "POST";

    const res = await fetch(
      method === "PATCH"
        ? api(`/item/weight/${editableWeight.weight_id}`)
        : api(`/item/weight/create`),
      {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include", // Include cookies for auth
      }
    );
    if (res.ok) {
      const updated = await fetch(api(`/item/${item.internalName}/weight`)).then((r) => r.json());
      setWeights(updated);
      setEditableWeight(null);
    } else {
      const errorData = await res.json().catch(() => ({}));
      alert(`Failed to save weight: ${errorData.message || res.statusText}`);
    }
    setSubmitting(false);
  };

  const generateWeightId = (itemName: string) => {
    const suffix = Math.random().toString(36).substring(2, 10); // 8-char suffix
    return `wynnpool_${itemName.toLowerCase()}_${suffix}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={editableWeight ? `sm:max-w-screen-lg` : `sm:max-w-lg`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <ItemIcon item={item} size={40} />
            {item.internalName}
          </DialogTitle>
          <DialogDescription className="capitalize">{item.type}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="md:flex space-x-6">
            {/* Left Column: Item Stats */}
            <div className="flex-1 overflow-y-auto space-y-2">
              <h3 className="text-base font-semibold">Weights</h3>
              {isLoadingWeight ? (
                <WeightSkeleton />
              ) : (
                <>
                  {weights.length === 0 && <p className="text-sm text-muted-foreground">No weights yet.</p>}
                  <div className="flex flex-col gap-2">
                    {weights.map((weight) => {
                      const total = Object.values(weight.identifications).reduce((sum, val) => sum + val, 0);

                      return (
                        <div key={weight.weight_id} className="border p-3 rounded-md space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium flex items-center gap-2">
                                <span className="inline-block px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                                  {weight.type}
                                </span>
                                {weight.weight_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {weight.author}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(weight.timestamp).toLocaleString()}
                              </p>
                              {weight.description && (
                                <p className="text-sm text-muted-foreground italic mt-1">{weight.description}</p>
                              )}
                            </div>
                            <WeightVoteButtons weightId={weight.weight_id} user={user} />
                          </div>

                          {/* Percent breakdown */}
                          <ul className="text-xs mt-2 grid grid-cols-1 gap-x-6">
                            {Object.entries(weight.identifications)
                              .sort(([, a], [, b]) => b - a) // 🔽 Sort descending by value
                              .map(([key, val]) => (
                                <li key={key} className="flex justify-between">
                                  <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                                  <span>{(val * 100).toFixed(1)}%</span>
                                </li>
                              ))}
                          </ul>
                          {/* <p className="text-xs text-right mt-1 text-muted-foreground">
                          Total: {(total * 100).toFixed(1)}%
                        </p> */}
                          {isAllowed && (
                            <div className="flex flex-grow items-end justify-end gap-2 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditableWeight(weight)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                  const confirmDelete = confirm(`Are you sure you want to delete "${weight.weight_name}"?`);
                                  if (!confirmDelete) return;

                                  const res = await fetch(api(`/item/weight/${weight.weight_id}`), {
                                    method: "DELETE",
                                    credentials: "include", // Include cookies for auth
                                  });

                                  if (res.ok) {
                                    const updated = await fetch(api(`/item/${item.internalName}/weight`)).then((r) => r.json());
                                    setWeights(updated);
                                  } else {
                                    alert("Failed to delete weight.");
                                  }
                                }}
                              >
                                🗑
                              </Button>
                            </div>
                          )}
                        </div>

                      );

                    })}
                  </div>
                </>
              )}
              {/* <h3 className="text-base font-semibold">Item Stats</h3>
            {Object.entries(item.identifications || {}).map(([key, value]) => (
              <div key={key} className="mt-2">
                <p className="capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                <p>{typeof value === "object" ? `${value.min} - ${value.max}` : value}</p>
              </div>
            ))} */}
              {isAllowed && (
                <div className="mt-6 border-t pt-4 space-y-3">
                  {/* <h3 className="text-base font-semibold">
                  {editableWeight ? "Edit Weight" : "Create New Weight"}
                </h3> */}
                  {/* Right Column: Weights & Editing */}

                  {/* New weight creator */}
                  {!editableWeight && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() =>
                        setEditableWeight({
                          item_name: item.internalName,
                          item_id: item.internalName,
                          weight_name: "",
                          weight_id: generateWeightId(item.internalName), // auto-generated!
                          type: "Wynnpool",
                          author: "Wynnpool Weight Team",
                          timestamp: Date.now(),
                          identifications: {},
                        })
                      }
                    >
                      + Add Weight
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Weights & Editing */}


            {/* Editable Weight */}
            {isAllowed && editableWeight && (
              <div className="flex-1">
                <div className="mt-6 space-y-3">
                  <h3 className="text-base font-semibold">Edit Weight</h3>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={editableWeight.weight_name}
                          onChange={(e) =>
                            setEditableWeight({
                              ...editableWeight,
                              weight_name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>ID</Label>
                        <Input value={editableWeight.weight_id} disabled readOnly />
                      </div>
                    </div>
                    <div className="w-full">
                      <Label>Description</Label>
                      <Input
                        value={editableWeight.description || ""}
                        onChange={(e) =>
                          setEditableWeight({
                            ...editableWeight,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Identifications</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.keys(item.identifications || {})
                          .filter((key) => !STATIC_IDS.includes(key))
                          .map((key) => {
                            const percent =
                              editableWeight.identifications[key] != null
                                ? Number((editableWeight.identifications[key] * 100).toFixed(2))
                                : "";

                            return (
                              <div key={key} className="flex items-center gap-2">
                                <span className="text-xs capitalize w-28">{key.replace(/([A-Z])/g, " $1")}</span>
                                <Input
                                  type="number"
                                  min={-100}
                                  max={100}
                                  step={0.5}
                                  inputMode="decimal"
                                  className="w-full"
                                  value={percent}
                                  onChange={(e) => {
                                    const raw = e.target.value;

                                    if (raw === "") {
                                      handleChangeWeight(key, 0);
                                      return;
                                    }

                                    const val = parseFloat(raw);
                                    if (!isNaN(val)) {
                                      handleChangeWeight(key, parseFloat((val / 100).toFixed(4)));
                                    }
                                  }}
                                />
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground text-right mt-1">
                      Total: {(Object.values(editableWeight.identifications).reduce(
                        (sum, val) => sum + (Math.abs(val) || 0), 0
                      ) * 100).toFixed(2)}%
                    </p>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="secondary" onClick={() => setEditableWeight(null)}>Cancel</Button>
                      <Button disabled={submitting ||
                        Number(
                          (
                            Object.values(editableWeight.identifications)
                              .reduce((sum, val) => sum + (Math.abs(val) || 0), 0) * 100
                          ).toFixed(2)
                        ) !== 100
                      } onClick={handleSubmit}>{submitting ? "Saving..." : "Save Weight"}</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function WeightSkeleton() {
  return (
    <div className="border p-3 rounded-md space-y-2 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-3 w-40 bg-muted rounded" />
        </div>
        <div className="h-6 w-16 bg-muted rounded" />
      </div>
      <div className="grid grid-cols-2 gap-x-6 mt-2">
        <div className="h-3 w-24 bg-muted rounded" />
        <div className="h-3 w-16 bg-muted rounded" />
        <div className="h-3 w-24 bg-muted rounded" />
        <div className="h-3 w-16 bg-muted rounded" />
      </div>
    </div>
  );
}