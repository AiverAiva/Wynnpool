"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from 'lucide-react'

interface Endpoint {
  name: string
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  description: string
  params: { name: string; type: string; description: string }[]
}

const endpoints: Endpoint[] = [
  {
    name: 'Get Aspects Data',
    path: '/api/aspects-data',
    method: 'GET',
    description: 'Retrieves all aspects data.',
    params: []
  },
  {
    name: 'Get Aspects Pool',
    path: '/api/aspects-pool',
    method: 'GET',
    description: 'Retrieves the current aspects pool.',
    params: []
  },
  {
    name: 'Get Lootrun Pool',
    path: '/api/lootrun-pool',
    method: 'GET',
    description: 'Retrieves the current lootrun pool.',
    params: []
  },
  {
    name: 'Search Items',
    path: '/api/items/search',
    method: 'POST',
    description: 'Searches for items based on provided criteria.',
    params: [
      { name: 'query', type: 'string', description: 'Search query string' },
      { name: 'category', type: 'string', description: 'Item category (optional)' },
      { name: 'limit', type: 'number', description: 'Maximum number of results to return (optional)' }
    ]
  }
]

export default function APIEndpointsPlayground() {
  const [activeEndpoint, setActiveEndpoint] = useState<Endpoint | null>(null)
  const [params, setParams] = useState<Record<string, string>>({})
  const [response, setResponse] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleParamChange = (name: string, value: string) => {
    setParams(prev => ({ ...prev, [name]: value }))
  }

  const handleEndpointChange = (endpoint: Endpoint) => {
    setActiveEndpoint(endpoint)
    setResponse('') // Clear the response when switching endpoint
    setError(null) // Clear the error when switching endpoint
    setParams({}) // Reset params when switching endpoint
  }

  const handleSubmit = async () => {
    if (!activeEndpoint) return

    setIsLoading(true)
    setError(null)
    try {
      const url = new URL(activeEndpoint.path, window.location.origin)
      const options: RequestInit = { method: activeEndpoint.method }

      if (activeEndpoint.method === 'GET') {
        activeEndpoint.params.forEach(param => {
          if (params[param.name]) {
            url.searchParams.append(param.name, params[param.name])
          }
        })
      } else if (activeEndpoint.method === 'POST') {
        options.headers = { 'Content-Type': 'application/json' }
        options.body = JSON.stringify(params)
      }

      const res = await fetch(url.toString(), options)
      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
    } catch (err) {
      setError('An error occurred while fetching the data.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const methodColors = {
    GET: 'text-blue-500',
    POST: 'text-green-500',
    PUT: 'text-yellow-500',
    DELETE: 'text-red-500',
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 mt-4">API Endpoints Playground</h1>
      <Accordion type="single" collapsible className="w-full">
        {endpoints.map((endpoint, index) => (
          <AccordionItem key={endpoint.path} value={`item-${index}`}>
            <AccordionTrigger>
              <span className={`font-mono ${methodColors[endpoint.method]}`}>
                {endpoint.method} {endpoint.path}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardHeader>
                  <CardTitle>{endpoint.name}</CardTitle>
                  <CardDescription>{endpoint.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <strong>Method:</strong> <span className={methodColors[endpoint.method]}>{endpoint.method}</span>
                  </div>
                  <div className="mb-4">
                    <strong>Path:</strong> {endpoint.path}
                  </div>
                  {endpoint.params.length > 0 && (
                    <div className="mb-4">
                      <strong>Parameters:</strong>
                      {endpoint.params.map(param => (
                        <div key={param.name} className="mt-2">
                          <Label htmlFor={param.name}>{param.name}</Label>
                          <Input
                            id={param.name}
                            placeholder={param.description}
                            value={params[param.name] || ''}
                            onChange={(e) => handleParamChange(param.name, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <Button onClick={() => { handleEndpointChange(endpoint); handleSubmit(); }} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Request
                  </Button>
                </CardContent>
                <CardFooter>
                  <div className="w-full">
                    <strong>Response:</strong>
                    <ScrollArea className="h-[200px] w-full rounded-md border p-4 mt-2">
                      {error ? (
                        <pre className="text-red-500">{error}</pre>
                      ) : (
                        <pre>{response}</pre>
                      )}
                    </ScrollArea>
                  </div>
                </CardFooter>
              </Card>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
