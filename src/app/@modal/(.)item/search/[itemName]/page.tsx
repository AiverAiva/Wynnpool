import { Modal } from "./modal";

export default async function ItemDetailModal({ params }: any) {
    const itemName = (await params).itemName;

    return (
        <Modal itemName={itemName} />
    );
}