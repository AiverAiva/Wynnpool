import { AspectTooltip } from "@/components/wynncraft/aspect/AspectTooltip"
import { useAspect } from "../context/AspectContext"
import { useState } from "react";

export function AspectTooltipWrapper({ name, children }: { name: string; children: React.ReactNode }) {
  const [openTooltip, setOpenTooltip] = useState<string | null>(null)
  const { getAspect } = useAspect()
  const aspect = getAspect(name)

  if (!aspect) return children

  return (
    <AspectTooltip
      aspect={aspect}
      open={openTooltip === aspect.aspectId}
      onOpenChange={(open) => setOpenTooltip(open ? aspect.aspectId : null)}>
      {children}
    </AspectTooltip>
  )
}
