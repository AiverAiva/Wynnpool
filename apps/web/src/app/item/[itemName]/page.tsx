'use client'

import { useParams } from 'next/navigation';
import ItemComponent from './ItemComponent';

export default function ItemPage() {
    const { itemName } = useParams<{ itemName: string }>();

    return (
        <div className="container mx-auto p-4 max-w-screen-lg">
            <div className="mt-[80px]" />
            <ItemComponent itemName={itemName} />
        </div>
    );
}
