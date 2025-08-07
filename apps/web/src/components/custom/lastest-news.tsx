'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TabsContent } from "@/components/ui/tabs"
import { Globe, Compass, Users, ExternalLink } from 'lucide-react'
import { Spinner } from "@/components/ui/spinner"

interface NewsItem {
  title: string
  date: string
  forumThread: string
  author: string
  content: string
  comments: string
}

export default function WynncraftNews() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/latest-news')

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (!Array.isArray(data)) {
          throw new Error("Invalid data format: expected array")
        }

        setNews(data)
      } catch (err) {
        console.error('Error fetching news:', err)
        setError('Failed to load news. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }


    fetchNews()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const truncateContent = (content: string, maxLength: number) => {
    const strippedContent = content.replace(/<[^>]+>/g, '');
    return strippedContent.length > maxLength
      ? strippedContent.substring(0, maxLength) + '...'
      : strippedContent
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('Debug - Latest news:', news);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest News</CardTitle>
        <CardDescription>Stay informed about recent changes to Wynncraft</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Spinner size="large" />
          </div>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <ul className="space-y-4">
            {Array.isArray(news) && news.slice(0, 3).map((item, index) => (
              <li key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {formatDate(item.date)} by {item.author}
                </p>
                <p className="text-sm mb-2" dangerouslySetInnerHTML={{ __html: truncateContent(item.content, 150) }}></p>
                <a
                  href={item.forumThread}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center"
                >
                  Read more <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}