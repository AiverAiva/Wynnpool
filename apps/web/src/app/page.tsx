import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import WynncraftNews from '@/components/custom/lastest-news'
import ServerStatusDisplay from '@/components/custom/server-status'
import { SparklesText } from '@/components/ui/sparkles-text'
import { ChangelogList } from "@/components/custom/changelog-list"
import { MeshGradientSVG } from "@/components/custom/mesh-gradient-svg"
import { ScrollDownIndicator } from "@/components/custom/ScrollDownIndicator"
import PixelBlast from "@/components/custom/PixelBlast"

export default async function HomePage() {
  return (
    <main>
      <section
        className="
      w-full min-h-screen 
      flex flex-col justify-center items-center 
      bg-background
      "
      >
        <PixelBlast
          variant="circle"
          pixelSize={6}
          color="#bfb0f0"
          patternScale={8}
          patternDensity={0.4}
          pixelSizeJitter={2}
          speed={0.5}
          edgeFade={0.3}
          transparent
        />
        <div
          className="
        mx-auto max-w-6xl px-24
        absolute flex flex-col-reverse md:flex-row 
        items-center justify-between 
        gap-12 w-full
        "
        >
          <ScrollDownIndicator />

          {/* LEFT — TEXT */}
          <div className="flex-1 text-center md:text-left">
            {/* <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground">
            Wynnpool
            </h1> */}
            <SparklesText className='text-5xl md:text-6xl tracking-tight text-foreground' text="Wynnpool" />
            <p className="mt-4 text-lg md:text-xl text-muted-foreground">
              Your all-in-one tool for everything Wynncraft
            </p>
          </div>

          {/* RIGHT — BLOB */}
          <div className="flex-1 flex justify-center md:justify-end">
            <div className="w-[240px] sm:w-[260px] md:w-[310px]">
              <MeshGradientSVG />
            </div>
          </div>
        </div>
      </section>
      <section className="container mx-auto px-4 py-8 max-w-screen-lg">
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
            <ChangelogList />
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
  )
}