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
  Terminal
} from "lucide-react"

import { NavFlat } from "~/components/nav-flat"
import { NavMain } from "~/components/nav-main"
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



// Team configurations with their respective navigation
const teams = [
  {
    name: "Store Management",
    logo: AudioWaveform,
    plan: "Production",
    navigation: storeNavigation,
  }
 
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
  const isDeveloperPortal = activeTeam.name === "Developer Portal"

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} onTeamChange={setActiveTeam} />
      </SidebarHeader>
      <SidebarContent>
      
          <NavFlat items={activeTeam.navigation || []} label="Platform" />
    
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
