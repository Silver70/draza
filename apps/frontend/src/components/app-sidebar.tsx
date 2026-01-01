"use client"

import * as React from "react"
import {
  AudioWaveform,
  Box,
  FileText,
  FolderTree,
  LayoutGrid,
  Users,
  Cog,
  BoltIcon,
  TicketPercentIcon,
  MegaphoneIcon,
  ShoppingCart,
  Code2,
  BookOpen,
  Blocks,
  Webhook,
  Terminal
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

// Navigation config for Store Management
const storeNavigation = [
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
    title: "Discounts",
    url: "/discounts",
    icon: TicketPercentIcon,
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
    title: "Carts",
    url: "/carts/",
    icon: ShoppingCart,
  },
  {
    title: "Campaigns",
    url: "/campaigns",
    icon: MegaphoneIcon,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Cog,
  },
]

// Navigation config for Developer Portal
const developerNavigation = [
  {
    title: "Overview",
    url: "/developer",
    icon: Code2,
  },
  {
    title: "Quick Start",
    url: "/developer/quickstart",
    icon: BoltIcon,
  },
  {
    title: "Guides",
    url: "/developer/guides",
    icon: BookOpen,
  },
  {
    title: "API Reference",
    url: "/developer/api",
    icon: Terminal,
  },
  {
    title: "Components",
    url: "/developer/components",
    icon: Blocks,
  },
  {
    title: "Webhooks",
    url: "/developer/webhooks",
    icon: Webhook,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Cog,
  },
]

// Team configurations with their respective navigation
const teams = [
  {
    name: "Store Management",
    logo: AudioWaveform,
    plan: "Production",
    navigation: storeNavigation,
  },
  {
    name: "Developer Portal",
    logo: Code2,
    plan: "Developer",
    navigation: developerNavigation,
  },
]

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [activeTeam, setActiveTeam] = React.useState(teams[0])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} onTeamChange={setActiveTeam} />
      </SidebarHeader>
      <SidebarContent>
        <NavFlat items={activeTeam.navigation} label="Platform" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
