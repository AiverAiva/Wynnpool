'use client'

import { useParams, useRouter } from "next/navigation";
import ItemComponent from "@/app/item/[itemName]/ItemComponent";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Dialog } from "@radix-ui/react-dialog";

export default async function ItemDetailModal() {
    const { itemName } = useParams<{ itemName: string }>();
    const router = useRouter();

    return (
        <Dialog open onOpenChange={() => router.back()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Item details</DialogTitle>
                </DialogHeader>
                <ScrollArea className='h-[70vh]'>
                    <ItemComponent itemName={itemName} />
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}