"use client"

import type React from "react"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Settings, User, Bell, Shield, Link2, Camera, Check, ExternalLink, Crown, Gamepad2, EllipsisVertical, CircleCheckBig, Link2Off, CornerDownRight } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

// Replace the strict UserProfile with an optional-friendly shape that can
// directly reflect the API response and nested discordProfile.
interface DiscordProfile {
  id?: string
  username?: string
  avatar?: string
  discriminator?: string
  global_name?: string
  banner?: string
  email?: string
  // ...other fields you may need...
}

interface MinecraftProfile {
  uuid?: string
  username?: string
  // ...other fields you may need...
}

interface UserProfile {
  id?: string
  discordId?: string
  username?: string
  discriminator?: string
  email?: string
  avatar?: string
  wynnUsername?: string
  isLinked?: boolean
  profileBanner?: string
  bio?: string
  isPublic?: boolean
  showStats?: boolean
  showInventory?: boolean
  // raw nested payload if needed
  discordProfile?: DiscordProfile
  minecraftProfile?: MinecraftProfile
}

export default function ProfilePage() {
  // start with null while loading real user data
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isUserLoading, setIsUserLoading] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState(false)
  const [linkingAccount, setLinkingAccount] = useState(false)
  const [wynnUsernameInput, setWynnUsernameInput] = useState("")

  async function fetchUser() {
    try {
      const res = await fetch(api("/user/me"), { credentials: "include" });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
  // Fetch user data automatically on mount
  useEffect(() => {
    fetchUser().then((u) => {
      setUser(u && u.discordProfile ? u : null);
      // console.log(u)
      // setLoading(false);
    });
  }, []);

  const handleLinkAccount = async () => {
    if (!wynnUsernameInput.trim()) return

    setLinkingAccount(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setUser((prev) => ({
      ...prev,
      wynnUsername: wynnUsernameInput,
      isLinked: true,
    }))
    setLinkingAccount(false)
  }

  const handleUnlinkAccount = () => {
    setUser((prev) => ({
      ...prev,
      wynnUsername: "",
      isLinked: false,
    }))
    setWynnUsernameInput("")
  }

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUser((prev) => ({
          ...prev,
          profileBanner: e.target?.result as string,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  if (!user) return null
  const userName = user.discordProfile?.global_name || user.discordProfile?.username || "User";
  const avatarUrl = user.discordProfile?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.discordProfile.id}/${user.discordProfile.avatar}.png`
    : undefined;
  const bannerUrl = user.discordProfile?.banner
    ? `https://cdn.discordapp.com/banners/${user.discordProfile.id}/${user.discordProfile.banner}.png?size=2048`
    : undefined;
  // console.log(user)
  // console.log(avatarUrl)
  // console.log(userName)
  return (
    <div className="min-h-screen bg-background">
      <div className="mt-[80px]" />
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    {/* <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.username || "User"} />
                    <AvatarFallback>{(user?.username || "U").slice(0, 2).toUpperCase()}</AvatarFallback> */}
                    <AvatarImage src={avatarUrl} alt={userName} />
                    <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{userName}</p>
                    <p className="text-xs text-muted-foreground">Wynnpool User</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <nav className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    PERSONAL
                  </div>
                  <Button variant="ghost" className="w-full justify-start text-sm h-9">
                    <User className="mr-3 h-4 w-4" />
                    Account
                  </Button>
                  {/* <Button variant="ghost" className="w-full justify-start text-sm h-9">
                    <Settings className="mr-3 h-4 w-4" />
                    Settings
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm h-9">
                    <Bell className="mr-3 h-4 w-4" />
                    Notifications
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm h-9">
                    <Shield className="mr-3 h-4 w-4" />
                    Privacy
                  </Button>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 mt-6">
                    GAMING
                  </div>
                  <Button variant="ghost" className="w-full justify-start text-sm h-9">
                    <Gamepad2 className="mr-3 h-4 w-4" />
                    Game Stats
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm h-9">
                    <Link2 className="mr-3 h-4 w-4" />
                    Linked Accounts
                  </Button> */}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
              <div className="relative">
                <div
                  className="h-48 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 relative"
                  style={
                    bannerUrl
                      ? {
                        backgroundImage: `url(${bannerUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                      : {}
                  }
                >
                  <div className="absolute inset-0 bg-black/20" />
                  {/* <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white border-white/20"
                    onClick={() => document.getElementById("banner-upload")?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Change Banner
                  </Button>
                  <input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerUpload}
                  /> */}
                </div>

                <div className="p-6 pt-0 mt-2">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-4 -mt-12">
                    <Avatar className="h-24 w-24 border-4 border-background mb-4 sm:mb-0">
                      <AvatarImage src={avatarUrl} alt={userName} />
                      <AvatarFallback className="text-2xl">{userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h1 className="text-2xl font-bold flex items-center gap-2">
                            {userName}
                            {/* {user?.isLinked && (
                              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                                <Check className="h-3 w-3 mr-1" />
                                Account Linked
                              </Badge>
                            )} */}
                          </h1>
                          {/* <p className="text-muted-foreground">
                            {user?.isLinked ? `Wynncraft: ${user?.wynnUsername}` : "Discord User"}
                          </p> */}
                        </div>
                        {/* <Button variant="outline" className="mt-4 sm:mt-0 bg-transparent">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Public Profile
                        </Button> */}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle>Account Integration</CardTitle>
                <CardDescription>meowww </CardDescription>
              </CardHeader>

              <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {user.discordProfile && (
                  <div className="flex flex-col space-y-6 border rounded-lg p-6">
                    <div className="flex justify-between items-center h-8">
                      <div className="flex space-x-3 items-center">
                        <div className="text-current icon-container icon-md text-2xl" style={{ color: "rgb(88,101,242)" }}>
                          {/* Discord glyph (kept small) */}
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 71 55" width="20" height="16" fill="currentColor" aria-hidden>
                            <g clipPath="url(#a)"><path d="M60.105 4.898A58.6 58.6 0 0 0 45.653.415a.22.22 0 0 0-.233.11 41 41 0 0 0-1.8 3.697c-5.456-.817-10.886-.817-16.23 0-.485-1.164-1.201-2.587-1.828-3.697a.23.23 0 0 0-.233-.11 58.4 58.4 0 0 0-14.451 4.483.2.2 0 0 0-.095.082C1.578 18.73-.944 32.144.293 45.39a.24.24 0 0 0 .093.167c6.073 4.46 11.955 7.167 17.729 8.962a.23.23 0 0 0 .249-.082 42 42 0 0 0 3.627-5.9.225.225 0 0 0-.123-.312 39 39 0 0 1-5.539-2.64.228.228 0 0 1-.022-.378 31 31 0 0 0 1.1-.862.22.22 0 0 1 .23-.03c11.619 5.304 24.198 5.304 35.68 0a.22.22 0 0 1 .233.027c.356.293.728.586 1.103.865a.228.228 0 0 1-.02.378 36.4 36.4 0 0 1-5.54 2.637.227.227 0 0 0-.121.315 47 47 0 0 0 3.624 5.897.225.225 0 0 0 .249.084c5.801-1.794 11.684-4.502 17.757-8.961a.23.23 0 0 0 .092-.164c1.48-15.315-2.48-28.618-10.497-40.412a.18.18 0 0 0-.093-.084Zm-36.38 32.427c-3.497 0-6.38-3.211-6.38-7.156s2.827-7.156 6.38-7.156c3.583 0 6.438 3.24 6.382 7.156 0 3.945-2.827 7.156-6.381 7.156Zm23.593 0c-3.498 0-6.38-3.211-6.38-7.156s2.826-7.156 6.38-7.156c3.582 0 6.437 3.24 6.38 7.156 0 3.945-2.798 7.156-6.38 7.156"></path></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h71v55H0z"></path></clipPath></defs>
                          </svg>

                        </div>
                        <p className="text-base font-semibold text-xl">Discord</p>
                      </div>
                      {/* <button
                        className="group/button flex items-center justify-center h-[34px] px-0 w-[34px] rounded-md text-sm bg-transparent border-transparent hover:bg-muted"
                        title="Options"
                        type="button"
                      >
                        <EllipsisVertical />
                      </button> */}
                    </div>


                    <div className="flex flex-col space-y-3">
                      <div className="flex space-x-3 items-center">
                        <CircleCheckBig className="text-green-500 w-6 h-6" />
                        <p className="text-sm flex items-center gap-[0.5ch]">
                          Connected as
                          <span className="inline-block font-medium">{userName}</span>
                        </p>
                      </div>

                    </div>
                  </div>
                )}

                <div className="flex flex-col space-y-6 border rounded-lg p-6">
                  <div className="flex justify-between items-center h-8">
                    <div className="flex space-x-3 items-center">
                        {/* Discord glyph (kept small) */}
                        {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 71 55" width="20" height="16" fill="currentColor" aria-hidden>
                            <g clipPath="url(#a)"><path d="M60.105 4.898A58.6 58.6 0 0 0 45.653.415a.22.22 0 0 0-.233.11 41 41 0 0 0-1.8 3.697c-5.456-.817-10.886-.817-16.23 0-.485-1.164-1.201-2.587-1.828-3.697a.23.23 0 0 0-.233-.11 58.4 58.4 0 0 0-14.451 4.483.2.2 0 0 0-.095.082C1.578 18.73-.944 32.144.293 45.39a.24.24 0 0 0 .093.167c6.073 4.46 11.955 7.167 17.729 8.962a.23.23 0 0 0 .249-.082 42 42 0 0 0 3.627-5.9.225.225 0 0 0-.123-.312 39 39 0 0 1-5.539-2.64.228.228 0 0 1-.022-.378 31 31 0 0 0 1.1-.862.22.22 0 0 1 .23-.03c11.619 5.304 24.198 5.304 35.68 0a.22.22 0 0 1 .233.027c.356.293.728.586 1.103.865a.228.228 0 0 1-.02.378 36.4 36.4 0 0 1-5.54 2.637.227.227 0 0 0-.121.315 47 47 0 0 0 3.624 5.897.225.225 0 0 0 .249.084c5.801-1.794 11.684-4.502 17.757-8.961a.23.23 0 0 0 .092-.164c1.48-15.315-2.48-28.618-10.497-40.412a.18.18 0 0 0-.093-.084Zm-36.38 32.427c-3.497 0-6.38-3.211-6.38-7.156s2.827-7.156 6.38-7.156c3.583 0 6.438 3.24 6.382 7.156 0 3.945-2.827 7.156-6.381 7.156Zm23.593 0c-3.498 0-6.38-3.211-6.38-7.156s2.826-7.156 6.38-7.156c3.582 0 6.437 3.24 6.38 7.156 0 3.945-2.798 7.156-6.38 7.156"></path></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h71v55H0z"></path></clipPath></defs>
                            </svg> */}
                        <img src="/icons/misc/minecraft_icon.png" alt="Minecraft" className="w-6 h-6" />
                      <p className="text-base font-semibold text-xl">Minecraft</p>
                    </div>
                    {/* <button
                        className="group/button flex items-center justify-center h-[34px] px-0 w-[34px] rounded-md text-sm bg-transparent border-transparent hover:bg-muted"
                        title="Options"
                        type="button"
                        >
                        <EllipsisVertical />
                        </button> */}
                  </div>


                  {user.minecraftProfile ? (
                    <div className="flex flex-col space-y-3">
                      <div className="flex space-x-3 items-center">
                        <CircleCheckBig className="text-green-500 w-6 h-6" />
                        <p className="text-sm flex items-center gap-[0.5ch]">
                          Connected as
                          <span className="inline-block font-medium">{userName}</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col space-y-3">
                        <div className="flex space-x-3 items-center">
                          <Link2Off className="text-red-500 w-6 h-6" />
                          <p className="text-sm flex items-center gap-[0.5ch]">
                            Not connected to a Minecraft profile.
                            {/* <span className="inline-block font-medium">{userName}</span> */}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex space-x-3 items-center cursor-pointer group">
                        <div className="text-2xl text-pink-500">
                          <CornerDownRight />
                        </div>
                        <Link href={'/link/minecraft'} prefetch={false}
                          className="group-hover:text-pink-500"
                        >
                          <p className="text-sm">Link my Minecraft profile</p>

                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>


            {/* Settings Tabs */}
            {/* <Tabs defaultValue="account" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="linking">Game Link</TabsTrigger>
                <TabsTrigger value="privacy">Privacy</TabsTrigger>
              </TabsList>

              <TabsContent value="account" className="space-y-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Your Discord account details and basic information.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="username">Discord Username</Label>
                        <Input
                          id="username"
                          value={`${user.username}#${user.discriminator}`}
                          disabled
                          className="bg-muted/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" value={user.email} disabled className="bg-muted/50" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discord-id">Discord ID</Label>
                      <Input id="discord-id" value={user.discordId} disabled className="bg-muted/50" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="profile" className="space-y-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle>Public Profile</CardTitle>
                    <CardDescription>Customize how your profile appears to other users.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell others about yourself..."
                        value={user.bio}
                        onChange={(e) => setUser((prev) => ({ ...prev, bio: e.target.value }))}
                        className="min-h-[100px]"
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Profile Visibility</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Public Profile</Label>
                            <p className="text-sm text-muted-foreground">Allow others to view your profile</p>
                          </div>
                          <Switch
                            checked={user.isPublic}
                            onCheckedChange={(checked) => setUser((prev) => ({ ...prev, isPublic: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Show Game Stats</Label>
                            <p className="text-sm text-muted-foreground">Display your Wynncraft statistics</p>
                          </div>
                          <Switch
                            checked={user.showStats}
                            onCheckedChange={(checked) => setUser((prev) => ({ ...prev, showStats: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Show Inventory</Label>
                            <p className="text-sm text-muted-foreground">Display your item collection</p>
                          </div>
                          <Switch
                            checked={user.showInventory}
                            onCheckedChange={(checked) => setUser((prev) => ({ ...prev, showInventory: checked }))}
                          />
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleSaveProfile} disabled={isLoading} className="w-full">
                      {isLoading ? "Saving..." : "Save Profile"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="linking" className="space-y-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gamepad2 className="h-5 w-5" />
                      Wynncraft Account Linking
                    </CardTitle>
                    <CardDescription>
                      Link your Wynncraft account to access advanced features and display your stats.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!user.isLinked ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Crown className="h-5 w-5 text-blue-500 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-blue-500">Link Your Account</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Connect your Wynncraft account to unlock features like stat tracking, item management,
                                and leaderboards.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="wynn-username">Wynncraft Username</Label>
                          <Input
                            id="wynn-username"
                            placeholder="Enter your Wynncraft username"
                            value={wynnUsernameInput}
                            onChange={(e) => setWynnUsernameInput(e.target.value)}
                          />
                        </div>

                        <Button
                          onClick={handleLinkAccount}
                          disabled={!wynnUsernameInput.trim() || linkingAccount}
                          className="w-full"
                        >
                          {linkingAccount ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Linking Account...
                            </>
                          ) : (
                            <>
                              <Link2 className="h-4 w-4 mr-2" />
                              Link Account
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-green-500 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-green-500">Account Successfully Linked</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Your Wynncraft account <strong>{user.wynnUsername}</strong> is now connected.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button variant="outline" className="flex-1 bg-transparent">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Stats
                          </Button>
                          <Button variant="destructive" onClick={handleUnlinkAccount} className="flex-1">
                            Unlink Account
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="privacy" className="space-y-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle>Privacy & Security</CardTitle>
                    <CardDescription>Control your privacy settings and data sharing preferences.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Data Collection</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow collection of gameplay data for analytics
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Marketing Emails</Label>
                          <p className="text-sm text-muted-foreground">Receive updates about new features and events</p>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Activity Status</Label>
                          <p className="text-sm text-muted-foreground">Show when you're online to other users</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
                      <div className="p-4 border border-destructive/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium">Delete Account</h5>
                            <p className="text-sm text-muted-foreground">
                              Permanently delete your account and all associated data
                            </p>
                          </div>
                          <Button variant="destructive" size="sm">
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs> */}
          </div>
        </div>
      </div>
    </div>
  )
}
