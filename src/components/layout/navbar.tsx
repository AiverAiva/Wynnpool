'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ModeToggle } from '@/components/layout/mode-toggle'
import { Menu } from 'lucide-react'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import React from 'react'

const navCategories = [
  {
    category: 'Main',
    items: [
      { name: 'Home', href: '/' },
      { name: 'Annihilation', href: '/annihilation' },
      { name: 'Stats', href: '/stats' },
      { name: 'Discord', href: 'https://discord.gg/QVxPPqHFMk' },
    ],
  },
  {
    category: 'Loopool',
    items: [
      { name: 'Lootrun', href: '/lootrun' },
      { name: 'Aspects', href: '/aspects' },
    ],
  },
  {
    category: 'Loadout',
    items: [
      { name: 'Aspects Data', href: '/aspects/data' },
      { name: 'Item Search', href: '/item/search' },
    ],
  },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  function isActive(triggerPaths: string[]) {
    return triggerPaths.includes(pathname);
  }

  return (
    <header className="bg-background/30 shadow-xs flex max-w-5xl h-[60px] sticky fixed items-center justify-between rounded-2xl inset-x-0 top-4 z-50 px-8 mx-auto backdrop-blur saturate-100 backdrop-blur-[10px] transition-colors">
      <div className="container flex h-14 mx-auto px-4 py-4 flex justify-between items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block text-xl">
              Wynnpool
            </span>
          </Link>
          <NavigationMenu>
            <NavigationMenuList className="flex items-center text-sm font-medium">
              <NavigationMenuItem>
                <Link href="/" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <p className={`transition-colors hover:text-foreground/80 ${pathname === '/' ? 'text-foreground' : 'text-foreground/60'
                      } `}>Home</p>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={`transition-colors hover:text-foreground/80 ${isActive(['/aspects', '/lootrun']) ? 'text-foreground' : 'text-foreground/60'
                    } `}
                >
                  Lootpool
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-6 md:w-[300px] lg:w-[400px] lg:grid-cols-1">
                    <ListItem href="/aspects" title="Aspects" className={pathname === "/aspects" ? 'bg-accent/50' : ''}>
                      A page where you can find information about the aspects pool and planner.
                    </ListItem>
                    <ListItem href="/lootrun" title="Lootrun" className={pathname === "/lootrun" ? 'bg-accent/50' : ''}>
                      Lootrun pool from every area in game, with detailed infomation.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={`transition-colors hover:text-foreground/80 ${isActive(['/item/search', '/aspects/data']) ? 'text-foreground' : 'text-foreground/60'
                    } `}
                >
                  Loadout
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-6 md:w-[300px] lg:w-[400px] lg:grid-cols-1">
                    <ListItem href="/item/search" title="Item search" className={pathname === "/item/search" ? 'bg-accent/50' : ''}>
                      Find the items with a selected filter.
                    </ListItem>
                    <ListItem href="/aspects/data" title="Aspect Data" className={pathname === "/aspects/data" ? 'bg-accent/50' : ''}>
                      A page with all the aspects and their effects, cateogrized by class.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/stats" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <p className={`transition-colors hover:text-foreground/80 ${pathname === '/stats' ? 'text-foreground' : 'text-foreground/60'
                      } `}>Stats</p>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/annihilation" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <p className={`transition-colors hover:text-foreground/80 ${pathname === '/annihilation' ? 'text-foreground' : 'text-foreground/60'
                      } `}>Annihilation</p>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="https://discord.gg/QVxPPqHFMk" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <p className={`transition-colors hover:text-foreground/80 text-foreground/60`}>Discord</p>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="flex items-center space-x-2">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <MobileLink href="/" className="flex items-center" onOpenChange={setIsOpen}>
                <span className="font-bold text-foreground">Wynnpool</span>
              </MobileLink>
              <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
                <div className="flex flex-col space-y-3">
                  {navCategories.map((category) => (
                    <div key={category.category}>
                      <h3 className="font-bold text-lg mt-4 mb-2">{category.category}</h3>
                      <div className="ml-2 flex flex-col space-y-2">
                        {category.items.map((item) => (
                          <MobileLink key={item.href} href={item.href} onOpenChange={setIsOpen}>
                            {item.name}
                          </MobileLink>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}

interface MobileLinkProps {
  href: string
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

function MobileLink({
  href,
  onOpenChange,
  className,
  children,
  ...props
}: MobileLinkProps) {
  const pathname = usePathname()
  return (
    <Link
      href={href}
      onClick={() => {
        onOpenChange?.(false)
      }}
      className={`${className} ${pathname === href
        ? 'text-foreground'
        : 'text-foreground/60 hover:text-foreground/80'
        }`}
      {...props}
    >
      {children}
    </Link>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={
            `${className} block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground`
          }
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"