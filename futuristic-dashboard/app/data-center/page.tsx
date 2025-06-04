"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Database, HardDrive, Download } from "lucide-react"

const storageData = [
  { name: "Main Storage", total: 1000, used: 750, type: "SSD" },
  { name: "Backup Storage", total: 2000, used: 1200, type: "HDD" },
]

const serverStatus = [
  { name: "Server 1", status: "Online", uptime: "99.99%" },
  { name: "Server 2", status: "Online", uptime: "99.95%" },
  { name: "Backup Node", status: "Offline", uptime: "97.00%" },
]

const backupInfo = [
  { date: "2024-06-10", status: "Success", size: "12GB" },
  { date: "2024-06-09", status: "Success", size: "12GB" },
  { date: "2024-06-08", status: "Failed", size: "-" },
]

export default function DataCenterPage() {
  return (
    <div className="container mx-auto p-6 bg-gradient-to-br from-black to-slate-900 text-slate-100">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-500">Data Center</h1>
      </header>
      <div className="grid gap-6">
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Database className="h-6 w-6 text-cyan-500" /> Data Center Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {storageData.map((s) => {
                const percent = Math.round((s.used / s.total) * 100)
                return (
                  <div key={s.name} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-slate-200">{s.name}</div>
                      <span className="text-xs text-slate-400">{s.type}</span>
                    </div>
                    <Progress value={percent} className="h-2 bg-slate-700" />
                    <div className="flex justify-between text-xs mt-2">
                      <span className="text-slate-400">{s.used}GB / {s.total}GB</span>
                      <span className="text-slate-400">{percent}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-100">Server Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-slate-400">
                    <th className="text-left py-2">Server</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Uptime</th>
                  </tr>
                </thead>
                <tbody>
                  {serverStatus.map((s) => (
                    <tr key={s.name} className="border-b border-slate-700/50">
                      <td className="py-2 flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-cyan-500" /> {s.name}
                      </td>
                      <td className={s.status === "Online" ? "text-green-500" : "text-red-400"}>{s.status}</td>
                      <td className="text-slate-300">{s.uptime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-100">Recent Backups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-slate-400">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {backupInfo.map((b) => (
                    <tr key={b.date} className="border-b border-slate-700/50">
                      <td className="py-2">{b.date}</td>
                      <td className={b.status === "Success" ? "text-green-500" : "text-red-400"}>{b.status}</td>
                      <td className="text-slate-300">{b.size}</td>
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