// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuTrigger,
//   } from "@/components/ui/dropdown-menu";
//   import { Menu } from "lucide-react";
//   import { Card } from "@/components/ui/card";
//   import { ModeToggle } from "@/components/ui/mode-toggle";
//   import { Button } from "@/components/ui/button";
//   // import ShadcnKit from "@/components/icons/shadcn-kit";
//   import { nanoid } from "nanoid";
//   import Link from "next/link";
  
//   const Navbar = () => {
//     return (
//       <Card className="container bg-card py-3 px-4 border-0 flex items-center justify-between gap-6 rounded-2xl mt-5">
//         <div className="text-primary cursor-pointer" />
  
//         <ul className="hidden md:flex items-center gap-10 text-card-foreground">
//           <li className="text-primary font-medium">
//             <a href="#home">Home</a>
//           </li>
//           <li>
//             <a href="#features">Features</a>
//           </li>
//           <li>
//             <a href="#pricing">Pricing</a>
//           </li>
//           <li>
//             <a href="#faqs">FAQs</a>
//           </li>
//           <li>
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <span className="cursor-pointer">Pages</span>
//               </DropdownMenuTrigger>
  
//               <DropdownMenuContent align="start">
//                 {landings.map((page) => (
//                   <DropdownMenuItem key={page.id}>
//                     <Link href={page.route}>{page.title}</Link>
//                   </DropdownMenuItem>
//                 ))}
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </li>
//         </ul>
  
//         <div className="flex items-center">
//           <Button variant="secondary" className="hidden md:block px-2">
//             Login
//           </Button>
//           <Button className="hidden md:block ml-2 mr-2">Get Started</Button>
  
//           <div className="flex md:hidden mr-2 items-center gap-2">
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <span className="py-2 px-2 bg-gray-100 rounded-md">Pages</span>
//               </DropdownMenuTrigger>
  
//               <DropdownMenuContent align="start">
//                 {landings.map((page) => (
//                   <DropdownMenuItem key={page.id}>
//                     <Link href={page.route}>{page.title}</Link>
//                   </DropdownMenuItem>
//                 ))}
//               </DropdownMenuContent>
//             </DropdownMenu>
  
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <Button variant="outline" size="icon">
//                   <Menu className="h-5 w-5 rotate-0 scale-100" />
//                 </Button>
//               </DropdownMenuTrigger>
  
//               <DropdownMenuContent align="end">
//                 <DropdownMenuItem>
//                   <a href="#home">Home</a>
//                 </DropdownMenuItem>
//                 <DropdownMenuItem>
//                   <a href="#features">Features</a>
//                 </DropdownMenuItem>
//                 <DropdownMenuItem>
//                   <a href="#pricing">Pricing</a>
//                 </DropdownMenuItem>
//                 <DropdownMenuItem>
//                   <a href="#faqs">FAQs</a>
//                 </DropdownMenuItem>
//                 <DropdownMenuItem>
//                   <Button variant="secondary" className="w-full text-sm">
//                     Login
//                   </Button>
//                 </DropdownMenuItem>
//                 <DropdownMenuItem>
//                   <Button className="w-full text-sm">Get Started</Button>
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </div>
  
//           <ModeToggle />
//         </div>
//       </Card>
//     );
//   };
  
//   const landings = [
//     {
//       id: nanoid(),
//       title: "Landing 01",
//       route: "/project-management",
//     },
//     {
//       id: nanoid(),
//       title: "Landing 02",
//       route: "/crm-landing",
//     },
//     {
//       id: nanoid(),
//       title: "Landing 03",
//       route: "/ai-content-landing",
//     },
//     {
//       id: nanoid(),
//       title: "Landing 04",
//       route: "/new-intro-landing",
//     },
//     {
//       id: nanoid(),
//       title: "Landing 05",
//       route: "/about-us-landing",
//     },
//     {
//       id: nanoid(),
//       title: "Landing 06",
//       route: "/contact-us-landing",
//     },
//     {
//       id: nanoid(),
//       title: "Landing 07",
//       route: "/faqs-landing",
//     },
//     {
//       id: nanoid(),
//       title: "Landing 08",
//       route: "/pricing-landing",
//     },
//     {
//       id: nanoid(),
//       title: "Landing 09",
//       route: "/career-landing",
//     },
//   ];
  
//   export default Navbar;
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ModeToggle } from '@/components/ui/mode-toggle'
import { Menu } from 'lucide-react'

const navItems = [
  { name: 'Home', href: '/' },
  // { name: 'Loot', href: '/loot' },
  { name: 'Aspects', href: '/aspects' },
  { name: 'Lootrun', href: '/lootrun' },
  { name: 'Annihilation', href: '/annihilation' },
  { name: 'Discord', href: 'https://discord.gg/QVxPPqHFMk' },
  // { name: 'About', href: '/about' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 mx-auto px-4 py-4 flex justify-between items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              Wynnpool
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors hover:text-foreground/80 ${
                  pathname === item.href ? 'text-foreground' : 'text-foreground/60'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-2">
          <ModeToggle />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <MobileLink
                href="/"
                className="flex items-center"
                onOpenChange={setIsOpen}
              >
                <span className="font-bold">Wynnpool</span>
              </MobileLink>
              <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
                <div className="flex flex-col space-y-3">
                  {navItems.map((item) => (
                    <MobileLink
                      key={item.href}
                      href={item.href}
                      onOpenChange={setIsOpen}
                    >
                      {item.name}
                    </MobileLink>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
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
      className={`${className} ${
        pathname === href
          ? 'text-foreground'
          : 'text-foreground/60 hover:text-foreground/80'
      }`}
      {...props}
    >
      {children}
    </Link>
  )
}
