"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState } from "react"

type GitHubContributor = {
  login: string
  avatar_url: string
  contributions: number
}

const staticCommunityTeams = [
  {
    teamName: "Item Weight Team",
    members: [
      {
        name: "breeze",
        uuid: "95b4e6aee90b49f990c0390d0a63c285",
      },
      {
        name: "Catherine",
        uuid: "900be42f975c49c7b60efffdd5df2d8c",
      },
      {
        name: "DoctorAgency",
        uuid: "ea9e82a70f914ea18c4c30a285441d18",
      },
      {
        name: "D4MIT",
        uuid: "496334be66ec45eb9c548d5a12223178",
      },
      {
        name: "Dwoc",
        uuid: "4c1f6f65939245208b290e68fd408781",
      },
      {
        name: "etwcatgirl",
        uuid: "ce8d3fa7c94d4ffe867bc37abbda4cf2",
      },
      {
        name: "MFLR5",
        uuid: "822cfbc6e4c24b1d98794cd8206f8a90",
      },
      {
        name: "on9",
        uuid: "930d149deb074821ace8bee4a212d4ce",
      },
      {
        name: "ROVERTANK",
        uuid: "35a62ed07cd946bd8bd2c99009b438eb",
      },
      {
        name: "T307",
        uuid: "1b1776c7aa4646ec93e43d030fd2cca1",
      },
      {
        name: "wisedrag",
        uuid: "e41e5d0d854e415f93b4a3218e374caa",
      },
    ],
  },
  {
    teamName: "Item Verification Team",
    members: [
      {
        name: "LogicalSpaghetti",
        avatar: "https://cdn.weikuwu.me/src/avatars/LogicalSpaghetti/p1.png"
      },
      {
        name: "Shironappa",
        avatar: "https://cdn.weikuwu.me/src/avatars/Shironappa/p1.png"
      },
    ],
  },
]

//maybe the list can be generated off database
//but for now hardcoding is fine
//minecraftprofile&roles for detecting 

export function CommunitySection() {

  const [githubContributors, setGithubContributors] = useState<GitHubContributor[]>([])

  useEffect(() => {
    fetch("/api/contributors")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setGithubContributors(data)
        }
      })
      .catch((error) => console.error("Error loading contributors:", error))
  }, [])

  const allTeams = [
    ...staticCommunityTeams,
    ...(githubContributors.length > 0
      ? [
        {
          teamName: "Github Contributors",
          members: githubContributors.map((contributor) => ({
            name: contributor.login,
            avatar: contributor.avatar_url,
            contributions: contributor.contributions,
          })),
        },
      ]
      : []),
  ]

  return (
    <section>
      <h2 className="mb-12 text-center text-2xl font-medium text-foreground">Community Contributors</h2>
      <div className="space-y-16">
        {allTeams.map((team) => (
          <div key={team.teamName}>
            <h3 className="mb-6 text-center text-lg font-normal text-muted-foreground">{team.teamName}</h3>
            <div className="flex flex-wrap justify-center gap-9">
              {team.members.map((member) => (
                <div key={member.name} className="flex w-28 flex-col items-center gap-3 text-center">
                  <Avatar className={`size-20 ${"uuid" in member ? "rounded-none" : "rounded-3xl"}`}>
                    <AvatarImage
                      src={
                        "uuid" in member
                          ? `https://vzge.me/face/128/${member.uuid}.png`
                          : member.avatar || "/placeholder.svg"
                      }
                      alt={member.name}
                    />
                    <AvatarFallback>
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm break-words font-normal text-foreground">{member.name}</p>
                    {"contributions" in member && typeof member.contributions === "number" && (
                      <p className="text-xs text-muted-foreground">{member.contributions} contributions</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
