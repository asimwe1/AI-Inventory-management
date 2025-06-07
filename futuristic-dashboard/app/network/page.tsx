"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Globe, Wifi, Radio } from "lucide-react"

const networkStatus = {
  status: "Online",
  latency: 12,
  bandwidth: 850,
  maxBandwidth: 1000,
}

const recentEvents = [
  { time: "10:01", event: "Connected to main server", type: "info" },
  { time: "09:45", event: "Bandwidth spike detected", type: "warning" },
  { time: "09:30", event: "Network backup completed", type: "success" },
]

export default function NetworkPage() {
  const percent = Math.round((networkStatus.bandwidth / networkStatus.maxBandwidth) * 100)
  return (
    <div className="container mx-auto p-6 bg-gradient-to-br from-black to-slate-900 text-slate-100">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Network</h1>
      </header>
      <div className="grid gap-6">
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Globe className="h-6 w-6 text-cyan-500" /> Network Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 mb-4">
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 text-xs">Status</span>
                <span className="text-green-500">{networkStatus.status}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 text-xs">Latency</span>
                <span className="text-slate-300">{networkStatus.latency}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 text-xs">Bandwidth</span>
                <span className="text-slate-300">{networkStatus.bandwidth}</span>
              </div>
            </div>
            <Progress value={percent} className="h-2 bg-slate-700" />
            <div className="text-xs text-slate-400 mt-2">{percent}% of max bandwidth</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-100">Recent Network Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-slate-400">
                    <th className="text-left py-2">Time</th>
                    <th className="text-left py-2">Event</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((e, i) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      <td className="py-2 text-slate-300 ">{e.time}</td>
                      <td className={
                        e.type === "success"
                          ? "text-green-500"
                          : e.type === "warning"
                          ? "text-amber-500"
                          : "text-slate-300"
                      }>
                        {e.event}
                      </td>
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