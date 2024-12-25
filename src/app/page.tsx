'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database, Heart } from "lucide-react"
import Link from "next/link"
import WynncraftNews from '@/components/custom/lastest-news'
import ServerStatusDisplay from '@/components/custom/server-status'
import { SparklesText } from '@/components/ui/sparkles-text'
import { GlobalSearch } from "@/components/custom/global-search"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-screen-lg">
        <section className="text-center mb-12">
          <div className='sm:flex mb-4 justify-center items-center'>
            <h1 className="text-4xl">Welcome to</h1><SparklesText className='text-4xl sm:ml-2' text="Wynnpool" />
          </div>
          <p className="text-xl text-muted-foreground mb-8">Your ultimate utility for up-to-date Wynncraft information</p>
          <GlobalSearch />
        </section>
        
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Item Database</CardTitle>
                <CardDescription>Browse and search for Wynncraft items</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/item/search">
                  <Button variant="outline" className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    Explore Items
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Support on Patreon</CardTitle>
                <CardDescription>Help keeping Wynnpool no ads by donating</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="https://www.patreon.com/AiverAiva">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Support Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
            {/* <Card>
              <CardHeader>
                <CardTitle>Quest Guide (WIP)</CardTitle>
                <CardDescription>Find detailed quest walkthroughs</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Quests
                </Button>
              </CardContent>
            </Card> */}
            {/* <Card>
              <CardHeader>
                <CardTitle>Player Stats (WIP)</CardTitle>
                <CardDescription>Look up player statistics and rankings</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Check Stats
                </Button>
              </CardContent>
            </Card> */}
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-4">Latest Updates</h2>
          <Tabs defaultValue="game">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="game">Latest News</TabsTrigger>
              <TabsTrigger value="items">Item Changelog</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>
            <TabsContent value="game">
              <WynncraftNews />
            </TabsContent>
            <TabsContent value="items">
              <Card>
                <CardHeader>
                  <CardTitle>Item changelogs (WIP)</CardTitle>
                  <CardDescription>Check out the latest changes to the items</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li>BBB(Mythic)</li>
                    <li>AAA(Legendary)</li>
                    <li>CCC(Unique)</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events (WIP)</CardTitle>
                  <CardDescription>Don't miss out on these limited-time events</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li>AAA (Starts June 1st)</li>
                    <li>BBB (May 15th - 17th)</li>
                    <li>CCC (Every Saturday)</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
        <section>
          <ServerStatusDisplay />
        </section>
      </main>

      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
          <p>&copy; 2024 Wynnpool. All rights reserved. Not affiliated with Wynncraft.</p>
        </div>
      </footer>
    </div>
  )
}