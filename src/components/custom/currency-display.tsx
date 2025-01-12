import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

const RATES = {
    STX: 4096 * 64,
    LE: 4096,
    EB: 64,
    E: 1
}

interface CurrencyDisplayProps {
    amount: number
}

export default function CurrencyDisplay({ amount }: CurrencyDisplayProps) {
    const currencies = [
        { name: 'STX', value: Math.floor(amount / RATES.STX) },
        { name: 'LE', value: Math.floor((amount % RATES.STX) / RATES.LE) },
        { name: 'EB', value: Math.floor((amount % RATES.LE) / RATES.EB) },
        { name: 'E', value: amount % RATES.EB }
    ].filter(currency => currency.value > 0)

    return (
        <div className="flex gap-3">
            {currencies.map(({ name, value }) => (
                <div key={name} className="flex items-center gap-1">
                    <Image
                        src={`/icons/currency/${name}.png`}
                        alt={`${name} icon`}
                        width={24}
                        height={24}
                    />
                    <span className="font-medium">
                        {value} {name}
                    </span>
                </div>
            ))}
        </div>
    )
}