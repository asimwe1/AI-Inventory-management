"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Command,
  Package,
  Truck,
  AlertTriangle,
  Database,
  Globe,
  Shield,
  Settings,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import "./globals.css"

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Command,
  },
  {
    name: "Products",
    href: "/products",
    icon: Package,
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: Truck,
  },
  {
    name: "Stock Alerts",
    href: "/alerts",
    icon: AlertTriangle,
  },
  {
    name: "Data Center",
    href: "/data-center",
    icon: Database,
  },
  {
    name: "Network",
    href: "/network",
    icon: Globe,
  },
  {
    name: "Security",
    href: "/security",
    icon: Shield,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const pathname = usePathname()

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-slate-950 text-slate-100">
          {/* Mobile Sidebar Toggle */}
          <div className="lg:hidden fixed top-4 left-4 z-50">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg bg-slate-800/50 backdrop-blur-sm border border-slate-700/50"
            >
              {isSidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Sidebar */}
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900/50 backdrop-blur-sm border-r border-slate-700/50 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="flex items-center justify-center h-16 border-b border-slate-700/50">
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
                  AI Inventory
                </h1>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-slate-800/50 text-cyan-500"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                      )}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-slate-700/50">
                <div className="text-xs text-slate-500">
                  AI-Driven Inventory System
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main
            className={cn(
              "transition-all duration-200 ease-in-out",
              isSidebarOpen ? "lg:ml-64" : "lg:ml-0"
            )}
          >
            <div className="min-h-screen">{children}</div>
          </main>
        </div>
      </body>
    </html>
  )
}
