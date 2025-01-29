'use client'

import { LootrunPoolHistory } from './lootrun-pool-history'
import { useEffect, useState } from 'react'
import api from '@/utils/api'
import { Spinner } from '@/components/ui/spinner'

export default function LootrunPoolHistoryPage() {
  const [lootData, setLootData] = useState<any | null>(null)

  useEffect(() => {
    fetch(api('/lootrun-pool?showAll=true'))
      .then(response => response.json())
      .then(data => setLootData(data))
  }, [])

  if (!lootData) return <div className="flex justify-center items-center h-screen"><Spinner size="large" /></div>

  return <LootrunPoolHistory historyFiles={lootData} />
}