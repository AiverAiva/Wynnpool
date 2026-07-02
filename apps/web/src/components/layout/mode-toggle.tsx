"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="theme-toggle.toggle-theme"
          data-testid="theme-toggle"
          className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
        >
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-[160px] rounded-2xl border-0 bg-background/70 p-1.5 shadow-[0_12px_40px_rgb(0_0_0/0.1),inset_0_1px_0_hsl(var(--foreground)/0.05)] backdrop-blur-2xl backdrop-saturate-150 dark:bg-background/60 dark:shadow-[0_16px_50px_rgb(0_0_0/0.5),inset_0_1px_0_hsl(0_0%_100/0.04)]"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-foreground/[0.05] focus:bg-foreground/[0.05] data-[highlighted]:bg-foreground/[0.05]"
        >
          Light
          {theme === "light" && <span className="size-1.5 rounded-full bg-foreground" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-foreground/[0.05] focus:bg-foreground/[0.05] data-[highlighted]:bg-foreground/[0.05]"
        >
          Dark
          {theme === "dark" && <span className="size-1.5 rounded-full bg-foreground" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-foreground/[0.05] focus:bg-foreground/[0.05] data-[highlighted]:bg-foreground/[0.05]"
        >
          System
          {theme === "system" && <span className="size-1.5 rounded-full bg-foreground" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
