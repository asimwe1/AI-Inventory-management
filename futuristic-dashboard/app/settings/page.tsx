"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Settings, User } from "lucide-react"

const userProfile = {
  name: "John Doe",
  role: "Administrator",
  email: "john.doe@example.com",
  joined: "2023-01-15",
}

const settingsOptions = [
  { label: "Dark Mode", description: "Enable dark mode theme", enabled: true },
  { label: "Enable Notifications", description: "Receive system notifications", enabled: true },
  { label: "Auto Updates", description: "Automatically update system", enabled: false },
  { label: "Beta Features", description: "Access experimental features", enabled: false },
]

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true)
  const [notifications, setNotifications] = useState(true)
  return (
    <div className="container mx-auto p-6 bg-slate-950 text-white">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </header>
      <div className="grid gap-6">
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-6 w-6 text-cyan-500" /> User Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-full bg-slate-700 flex items-center justify-center">
                <User className="h-8 w-8 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">{userProfile.name}</h3>
                <p className="text-white">{userProfile.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settingsOptions.map((option, idx) => (
                <div key={option.label} className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-200">{option.label}</span>
                    <span className="text-slate-400 text-sm">{option.description}</span>
                  </div>
                  <Switch checked={option.enabled} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 