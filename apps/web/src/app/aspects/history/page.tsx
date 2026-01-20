import DeprecatedRedirect from "@/components/page/deprecated-redirect";

export default function Page() {
  return <DeprecatedRedirect redirectTo="/raidpool/" />
}

// 'use client'

// import { AspectPoolHistory } from './aspect-pool-history'
// import { useEffect, useState } from 'react'
// import api from '@/lib/api'
// import { Spinner } from '@/components/ui/spinner'

// export default function AspectPoolHistoryPage() {
//   // const historyFiles = await getHistoryFiles()

//   // return <AspectPoolHistory historyFiles={historyFiles} />
//   const [lootData, setLootData] = useState<any | null>(null)

//   useEffect(() => {
//     fetch(api('/aspect-pool?showAll=true'))
//       .then(response => response.json())
//       .then(data => setLootData(data))
//   }, [])

//   if (!lootData) return <div className="flex justify-center items-center h-screen"><Spinner size="large" /></div>

//   return (
//     <div>
//       <div className="mt-[80px]" />
//       <AspectPoolHistory historyFiles={lootData} />
//     </div>
//   )
// }