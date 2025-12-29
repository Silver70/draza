"use client"

import * as React from "react"
import {
  AudioWaveform,
  Box,
  Command,
  GalleryVerticalEnd,
  FileText,
  FolderTree,
  LayoutGrid,
  Users,
  Cog,
  BoltIcon
} from "lucide-react"

import { NavFlat } from "~/components/nav-flat"
import { NavUser } from "~/components/nav-user"
import { TeamSwitcher } from "~/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: AudioWaveform,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: GalleryVerticalEnd,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
     {
      title: "overview",
      url: "/",
      icon: BoltIcon,
    },
    {
      title: "Products",
      url: "/inventory/products",
      icon: Box,
    },
    {
      title: "Categories",
      url: "/inventory/categories",
      icon: FolderTree,
    },
    {
      title: "Collections",
      url: "/inventory/collections",
      icon: LayoutGrid,
    },
    {
      title: "Customers",
      url: "/customers",
      icon: Users,
    },
    {
      title: "Orders",
      url: "/orders",
      icon: FileText,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Cog,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavFlat items={data.navMain} label="Platform" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
