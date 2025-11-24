import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Github, Twitter, Linkedin, MessageCircle, Globe } from "lucide-react"

const teamMembers = [
  {
    name: "AiverAiva",
    title: "Founder & Full-stack Developer ",
    role: "Handled architecture, DevOps, infrastructure, security, and quality assurance throughout the project lifecycle.",
    avatar: "https://avatars.githubusercontent.com/u/43096905",
    social: [
      { platform: "github", url: "https://weikuwu.me/", icon: Globe },
      { platform: "github", url: "https://github.com/AiverAiva", icon: Github },
    ],
  },
]

export function TeamSection() {
  return (
    <section className="mb-32">
      <h2 className="mb-12 text-center text-2xl font-medium text-foreground">Project Maintainer</h2>
      <div className="flex flex-wrap justify-center gap-8 md:gap-12">
        {teamMembers.map((member) => (
          <div key={member.name} className="flex w-full max-w-xs flex-col items-center gap-6 text-center sm:w-auto">
            <Avatar className="h-40 w-40 rounded-[3rem] md:h-48 md:w-48">
              <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
              <AvatarFallback className="rounded-[3rem] text-2xl">
                {member.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="text-xl font-normal text-foreground">{member.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{member.title}</p>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{member.role}</p>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              {member.social.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.platform}
                    href={social.url}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={social.platform}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
