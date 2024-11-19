'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Spinner } from '@/components/ui/spinner'

interface Tier {
  [key: string]: string
}

interface Aspect {
  name: string
  id: string
  rarity: string
  description: string
  tiers: Tier
}

interface AspectData {
  [className: string]: Aspect[]
}

export default function AspectDataPage() {
  const [data, setData] = useState<AspectData | null>(null)
  const [expandedClass, setExpandedClass] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAspectData() {
      try {
        const res = await fetch('/api/aspects-data/')
        if (!res.ok) {
          throw new Error('Failed to fetch aspect data')
        }
        const aspectData = await res.json()
        setData(aspectData)
      } catch (err) {
        setError('An error occurred while fetching the data.')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAspectData()
  }, [])

  const toggleClass = (className: string) => {
    setExpandedClass(expandedClass === className ? null : className)
  }

  const getRarityColor = (rarity: string) => {
    const colors: { [key: string]: string } = {
      legendary: "bg-cyan-500",
      fabled: "bg-red-500",
      mythic: "bg-purple-500"
    }
    return colors[rarity.toLowerCase()] || "bg-gray-500"
  }

  if (isLoading) {
    return <div className="items-center justify-center h-screen flex"><Spinner size="large" /></div>
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>
  }

  if (!data) {
    return <div className="flex justify-center items-center h-screen">No data available</div>
  }

  return (
    <div className="container mx-auto p-4 max-w-screen-lg">
      <h1 className="text-3xl font-bold mb-4">Aspect Data</h1>
      <ScrollArea className="h-[calc(100vh-100px)]">
        {Object.entries(data).map(([className, aspects]) => (
          <Card key={className} className="mb-4">
            <CardHeader 
              className="cursor-pointer" 
              onClick={() => toggleClass(className)}
            >
              <CardTitle className="flex items-center">
                {expandedClass === className ? <ChevronDown className="mr-2" /> : <ChevronRight className="mr-2" />}
                {className}
              </CardTitle>
              <CardDescription>{aspects.length} aspects</CardDescription>
            </CardHeader>
            {expandedClass === className && (
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {aspects.map((aspect, index) => (
                    <AccordionItem key={aspect.id} value={`${className}-${index}`}>
                      <AccordionTrigger>
                        <div className="flex items-center">
                          <span className="mr-2">{aspect.name}</span>
                          <Badge className={`${getRarityColor(aspect.rarity)} text-white`}>
                            {aspect.rarity}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-4">
                          <p><strong>Description:</strong> {aspect.description}</p>
                          <div className="mt-2">
                            <strong>Tiers:</strong>
                            {Object.entries(aspect.tiers).map(([tier, effect]) => (
                              <div key={tier} className="ml-4">
                                <strong>{tier}:</strong> {effect.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                              </div>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            )}
          </Card>
        ))}
      </ScrollArea>
    </div>
  )
}