import type { Item } from "@wynnpool/shared";

export interface IdentificationInfo {
    displayName: string;
    detailedName?: string;
    unit?: string;
    symbol?: string;
}
export interface Powder {
    element: number;
    tier: number;
}

export type Identification = {
    value: string
    label: string
}