'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
// import { Pagination } from '@/components/ui/pagination'
import api from '@/utils/api'
import { Button } from '@/components/ui/button'

interface Guild {
  rank: number;
  guild_uuid: string;
  guild_name: string;
  avg_online: number;
}
// import { useState, useEffect } from 'react'
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Loader2 } from 'lucide-react'

// const leaderboards = [
//   "guildLevel", "guildTerritories", "guildWars", "woodcuttingLevel", "miningLevel",
//   "fishingLevel", "farmingLevel", "alchemismLevel", "armouringLevel", "cookingLevel",
//   "jewelingLevel", "scribingLevel", "tailoringLevel", "weaponsmithingLevel",
//   "woodworkingLevel", "professionsGlobalLevel", "combatGlobalLevel", "totalGlobalLevel",
//   "playerContent", "combatSoloLevel", "professionsSoloLevel", "totalSoloLevel",
//   "globalPlayerContent", "hardcoreLegacyLevel", "warsCompletion", "ironmanContent",
//   "ultimateIronmanContent", "hardcoreContent", "craftsmanContent", "huntedContent",
//   "huicContent", "huichContent", "hichContent", "hicContent", "orphionCompletion",
//   "colossusCompletion", "grootslangCompletion", "orphionSrGuilds", "namelessSrGuilds",
//   "orphionSrPlayers", "grootslangSrGuilds", "colossusSrGuilds", "colossusSrPlayers",
//   "grootslangSrPlayers", "namelessSrPlayers", "namelessCompletion"
// ]

// interface LeaderboardEntry {
//   name: string
//   value: number
// }

// interface LeaderboardData {
//   [key: string]: LeaderboardEntry
// }

export default function StatsPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [filteredGuilds, setFilteredGuilds] = useState<Guild[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const guildsPerPage = 20;

  useEffect(() => {
    fetchGuilds();
  }, []);

  useEffect(() => {
    const filtered = guilds.filter(guild =>
      guild.guild_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredGuilds(filtered);
    setCurrentPage(1);
  }, [searchTerm, guilds]);

  const fetchGuilds = async () => {
    try {
      const response = await fetch(api('/leaderboard/guild-average-online'));
      const data = await response.json();
      setGuilds(data);
      setFilteredGuilds(data);
    } catch (error) {
      console.error('Error fetching guild data:', error);
    }
  };

  const indexOfLastGuild = currentPage * guildsPerPage;
  const indexOfFirstGuild = indexOfLastGuild - guildsPerPage;
  const currentGuilds = filteredGuilds.slice(indexOfFirstGuild, indexOfLastGuild);

  return (
    <div className="container mx-auto p-4 max-w-screen-lg">
      <div className="mt-[80px]" />
      <span className='text-3xl font-mono'>this page is incomplete af :3 <br/>if u want to see any stats join discord and suggest it :D</span>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Guild Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="Search guilds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Guild Name</TableHead>
                <TableHead>Avg. Online</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentGuilds.map((guild) => (
                <TableRow key={guild.guild_uuid}>
                  <TableCell>{guild.rank}</TableCell>
                  <TableCell>{guild.guild_name}</TableCell>
                  <TableCell>{guild.avg_online.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredGuilds.length / guildsPerPage)}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  )
  // const [selectedLeaderboard, setSelectedLeaderboard] = useState(leaderboards[0])
  // const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>({})
  // const [loading, setLoading] = useState(false)
  // const [error, setError] = useState<string | null>(null)
  // const [page, setPage] = useState(1)
  // const itemsPerPage = 20

  // useEffect(() => {
  //   fetchLeaderboardData()
  // }, [selectedLeaderboard, page])

  // const fetchLeaderboardData = async () => {
  //   setLoading(true)
  //   setError(null)
  //   try {
  //     const response = await fetch(`https://api.wynncraft.com/v3/leaderboards/${selectedLeaderboard}?page=${page}`)
  //     if (!response.ok) {
  //       throw new Error('Failed to fetch leaderboard data')
  //     }
  //     const data = await response.json()
  //     setLeaderboardData(data.data)
  //   } catch (err) {
  //     setError('An error occurred while fetching the leaderboard data.')
  //     console.error(err)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // const handleLeaderboardChange = (value: string) => {
  //   setSelectedLeaderboard(value)
  //   setPage(1)
  // }

  // const formatLeaderboardName = (name: string) => {
  //   return name
  //     .replace(/([A-Z])/g, ' $1')
  //     .replace(/^./, (str) => str.toUpperCase())
  //     .trim()
  // }

  // const sortedEntries = Object.entries(leaderboardData).sort((a, b) => Number(a[0]) - Number(b[0]))

  // return (
  //   <div className="container mx-auto p-4">
  //     <Card>
  //       <CardHeader>
  //         <CardTitle>Wynncraft Leaderboards</CardTitle>
  //         <CardDescription>Select a leaderboard to view the top players or guilds</CardDescription>
  //       </CardHeader>
  //       <CardContent>
  //         <Select onValueChange={handleLeaderboardChange} value={selectedLeaderboard}>
  //           <SelectTrigger className="w-full mb-4">
  //             <SelectValue placeholder="Select a leaderboard" />
  //           </SelectTrigger>
  //           <SelectContent>
  //             {leaderboards.map((leaderboard) => (
  //               <SelectItem key={leaderboard} value={leaderboard}>
  //                 {formatLeaderboardName(leaderboard)}
  //               </SelectItem>
  //             ))}
  //           </SelectContent>
  //         </Select>

  //         {loading ? (
  //           <div className="flex justify-center items-center h-64">
  //             <Loader2 className="h-8 w-8 animate-spin" />
  //           </div>
  //         ) : error ? (
  //           <div className="text-red-500 text-center">{error}</div>
  //         ) : (
  //           <>
  //             <Table>
  //               <TableHeader>
  //                 <TableRow>
  //                   <TableHead>Rank</TableHead>
  //                   <TableHead>Name</TableHead>
  //                   <TableHead>Value</TableHead>
  //                 </TableRow>
  //               </TableHeader>
  //               <TableBody>
  //                 {sortedEntries.map(([rank, entry]) => (
  //                   <TableRow key={rank}>
  //                     <TableCell>{rank}</TableCell>
  //                     <TableCell>{entry.name}</TableCell>
  //                     <TableCell>{entry.value.toLocaleString()}</TableCell>
  //                   </TableRow>
  //                 ))}
  //               </TableBody>
  //             </Table>

  //             <div className="flex justify-between items-center mt-4">
  //               <Button
  //                 onClick={() => setPage((prev) => Math.max(1, prev - 1))}
  //                 disabled={page === 1}
  //               >
  //                 Previous
  //               </Button>
  //               <span>Page {page}</span>
  //               <Button
  //                 onClick={() => setPage((prev) => prev + 1)}
  //                 disabled={Object.keys(leaderboardData).length < itemsPerPage}
  //               >
  //                 Next
  //               </Button>
  //             </div>
  //           </>
  //         )}
  //       </CardContent>
  //     </Card>
  //   </div>
  // )
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex justify-center items-center space-x-2 mt-4">
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        variant="outline"
      >
        Previous
      </Button>
      <span className="text-sm">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        variant="outline"
      >
        Next
      </Button>
    </div>
  )
}