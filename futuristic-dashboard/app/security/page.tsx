"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, AlertCircle, Lock } from "lucide-react"

const securityStatus = {
  status: "Secure",
  lastScan: "2024-06-10 08:00",
  threatsFound: 0,
}

const recentAlerts = [
  { time: "07:45", alert: "Login attempt blocked", type: "warning" },
  { time: "06:30", alert: "System scan completed", type: "info" },
]

const accessLogs = [
  { user: "admin", time: "2024-06-10 07:30", action: "Logged in" },
  { user: "jane", time: "2024-06-10 06:50", action: "Viewed products" },
]

export default function SecurityPage() {
  return (
    <div className="container mx-auto p-6 bg-gradient-to-br from-black to-slate-900 text-slate-100">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Security</h1>
      </header>
      <div className="grid gap-6">
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Shield className="h-6 w-6 text-cyan-500" /> Security Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 mb-4">
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 text-xs">Status</span>
                <span className="text-green-500">{securityStatus.status}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 text-xs">Last Scan</span>
                <span className="text-slate-300">{securityStatus.lastScan}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 text-xs">Threats Found</span>
                <span className="text-slate-300">{securityStatus.threatsFound}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-100">Recent Security Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-slate-400">
                    <th className="text-left py-2">Time</th>
                    <th className="text-left py-2">Alert</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAlerts.map((a, i) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      <td className="py-2 text-slate-300">{a.time}</td>
                      <td className={
                        a.type === "warning"
                          ? "text-amber-500"
                          : "text-slate-300"
                      }>
                        {a.alert}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-100">User Access Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-slate-400">
                    <th className="text-left py-2">User</th>
                    <th className="text-left py-2">Time</th>
                    <th className="text-left py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {accessLogs.map((log, i) => (
                    <tr key={i} className="border-b text-slate-100 border-slate-700/50">
                      <td className="py-2">{log.user}</td>
                      <td className="py-2">{log.time}</td>
                      <td className="py-2">{log.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 