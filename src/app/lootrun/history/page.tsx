import { promises as fs } from 'fs'
import path from 'path'
import { LootrunPoolHistory } from './lootrun-pool-history'

async function getHistoryFiles() {
  const historyDir = path.join(process.cwd(), 'src/data/history/lootrun_pool')
  const files = await fs.readdir(historyDir)
  return files
    .filter(file => file.endsWith('.json'))
    .map(file => {
      const timestamp = parseInt(file.split('_').pop()?.split('.')[0] || '0', 10)
      return { filename: file, timestamp }
    })
    .sort((a, b) => b.timestamp - a.timestamp)
}

export default async function LootrunPoolHistoryPage() {
  const historyFiles = await getHistoryFiles()

  return <LootrunPoolHistory historyFiles={historyFiles} />
}