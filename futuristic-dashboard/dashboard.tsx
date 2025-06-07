"use client"

import { useEffect, useState, useRef } from "react"
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  CircleOff,
  Command,
  Cpu,
  Database,
  Download,
  Globe,
  HardDrive,
  Hexagon,
  LineChart,
  Lock,
  MessageSquare,
  Mic,
  Moon,
  Radio,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sun,
  Terminal,
  Wifi,
  Zap,
  Package,
  Truck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Box,
  DollarSign,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// Add new types for inventory system
interface Product {
  id: string
  name: string
  description: string | null
  category: string
  sku: string
  unit_price: number
  min_stock_level: number
  max_stock_level: number
  lead_time_days: number
  current_stock: number
  reorder_point: number | null
  created_at: string
  updated_at: string
}

interface InventoryTransaction {
  id: number
  product_id: string
  transaction_type: 'received' | 'shipped' | 'adjusted'
  quantity: number
  previous_stock: number
  new_stock: number
  reference_number: string | null
  notes: string | null
  created_at: string
}

interface InventoryAdvice {
  product_id: string
  advice: string
  order_quantity: number
  reorder_point: number
  days_of_stock: number
  urgency: 'HIGH' | 'MEDIUM' | 'LOW'
}

// Add type for Info and Check components
interface InfoProps {
  className?: string;
}

interface CheckProps {
  className?: string;
}

export default function Dashboard() {
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [systemStatus, setSystemStatus] = useState(85)
  const [cpuUsage, setCpuUsage] = useState(42)
  const [memoryUsage, setMemoryUsage] = useState(68)
  const [networkStatus, setNetworkStatus] = useState(92)
  const [securityLevel, setSecurityLevel] = useState(75)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Inventory states
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [inventoryAdvice, setInventoryAdvice] = useState<InventoryAdvice[]>([])
  const [lowStockItems, setLowStockItems] = useState<Product[]>([])
  const [totalInventoryValue, setTotalInventoryValue] = useState(0)
  const [stockAlerts, setStockAlerts] = useState<{product: Product, urgency: string}[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Fetch inventory data
  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        // Fetch products
        const productsResponse = await fetch('http://localhost:8000/api/products/products/');
        if (!productsResponse.ok) {
          throw new Error(`Failed to fetch products: HTTP ${productsResponse.status}`);
        }
        const productsData = await productsResponse.json();
        console.log("Products response:", productsData);
        if (!Array.isArray(productsData)) {
          throw new Error("Products data is not an array");
        }
        setProducts(productsData);

        // Calculate total inventory value
        const totalValue = productsData.reduce((sum: number, product: Product) => 
          sum + (product.current_stock * product.unit_price), 0);
        setTotalInventoryValue(totalValue);

        // Identify low stock items
        const lowStock = productsData.filter((product: Product) => 
          product.current_stock <= (product.reorder_point || product.min_stock_level));
        setLowStockItems(lowStock);

        // Generate stock alerts
        const alerts = lowStock.map((product: Product) => {
          const daysUntilReorder = product.current_stock / 
            (product.max_stock_level / product.lead_time_days);
          const urgency = daysUntilReorder <= 2 ? 'HIGH' : 
                         daysUntilReorder <= 5 ? 'MEDIUM' : 'LOW';
          return { product, urgency };
        });
        setStockAlerts(alerts);

        // Fetch recent transactions
        const transactionsResponse = await fetch('http://localhost:8000/api/inventory/inventory/transactions');
        if (!transactionsResponse.ok) {
          throw new Error(`Failed to fetch transactions: HTTP ${transactionsResponse.status}`);
        }
        const transactionsData = await transactionsResponse.json();
        console.log("Transactions response:", transactionsData);
        if (!Array.isArray(transactionsData)) {
          throw new Error("Transactions data is not an array");
        }
        setTransactions(transactionsData);

        // Fetch inventory advice
        const advicePromises = productsData.map((product: Product) =>
          fetch('http://localhost:8000/api/predictions/predictions/advice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product_id: product.id,
              current_stock: product.current_stock
            })
          }).then(async (res) => {
            if (!res.ok) {
              throw new Error(`Failed to fetch advice for product ${product.id}: HTTP ${res.status}`);
            }
            const adviceData = await res.json();
            console.log(`Advice for product ${product.id}:`, adviceData);
            return adviceData;
          })
        );
        const adviceData = await Promise.all(advicePromises);
        setInventoryAdvice(adviceData);

        setIsLoading(false);
        setError(null);
      } catch (error: any) {
        console.error('Error fetching inventory data:', error);
        setError(`Failed to load data: ${error.message}`);
        setProducts([]);
        setTransactions([]);
        setInventoryAdvice([]);
        setLowStockItems([]);
        setStockAlerts([]);
        setTotalInventoryValue(0);
        setIsLoading(false);
      }
    };

    fetchInventoryData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchInventoryData, 300000);
    return () => clearInterval(interval);
  }, []);

  // Update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Simulate changing data
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 30) + 30)
      setMemoryUsage(Math.floor(Math.random() * 20) + 60)
      setNetworkStatus(Math.floor(Math.random() * 15) + 80)
      setSystemStatus(Math.floor(Math.random() * 10) + 80)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Update particle effect with proper null checks
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    if (!width || !height) return

    canvas.width = width
    canvas.height = height

    const particles: Particle[] = []
    const particleCount = 100

    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string

      constructor() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.size = Math.random() * 3 + 1
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.5
        this.color = `rgba(${Math.floor(Math.random() * 100) + 100}, ${Math.floor(Math.random() * 100) + 150}, ${Math.floor(Math.random() * 55) + 200}, ${Math.random() * 0.5 + 0.2})`
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (this.x > width) this.x = 0
        if (this.x < 0) this.x = width
        if (this.y > height) this.y = 0
        if (this.y < 0) this.y = height
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const particle of particles) {
        particle.update()
        particle.draw()
      }

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      if (!canvas) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div
      className={`${theme} min-h-screen bg-gradient-to-br from-black to-slate-900 text-slate-100 relative overflow-hidden`}
    >
      {/* Background particle effect */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping"></div>
              <div className="absolute inset-2 border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-4 border-4 border-r-purple-500 border-t-transparent border-b-transparent border-l-transparent rounded-full animate-spin-slow"></div>
              <div className="absolute inset-6 border-4 border-b-blue-500 border-t-transparent border-r-transparent border-l-transparent rounded-full animate-spin-slower"></div>
              <div className="absolute inset-8 border-4 border-l-green-500 border-t-transparent border-r-transparent border-b-transparent rounded-full animate-spin"></div>
            </div>
            <div className="mt-4 text-cyan-500 font-mono text-sm tracking-wider">Loading...</div>
          </div>
        </div>
      )}

      <div className="container mx-auto p-4 relative z-10">
        {/* Error Display */}
        {error && (
          <div className="text-red-500 mb-4 text-center">{error}</div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Main dashboard content */}
          <div className="lg:col-span-9">
            <div className="grid gap-3">
              {/* System overview with inventory metrics */}
              <Card className="bg-slate-900/50 border-t border-slate-700/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-slate-700/50 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-200 flex items-center">
                      <Activity className="mr-2 h-5 w-5 text-cyan-500" />
                      Inventory Overview
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-slate-800/50 text-cyan-400 border-cyan-500/50 text-xs rounded">
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 mr-1 animate-pulse"></div>
                        LIVE
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-slate-400"
                        onClick={() => window.location.reload()}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard
                      title="Total Products"
                      value={products.length}
                      icon={Package}
                      trend="up"
                      color="cyan"
                      detail={`${lowStockItems.length} items need attention`}
                      type="count"
                    />
                    <MetricCard
                      title="Total Value"
                      value={totalInventoryValue}
                      icon={DollarSign}
                      trend="up"
                      color="green"
                      detail={formatCurrency(totalInventoryValue)}
                      type="currency"
                    />
                    <MetricCard
                      title="Stock Alerts"
                      value={stockAlerts.length}
                      icon={AlertTriangle}
                      trend="down"
                      color="red"
                      detail={`${stockAlerts.filter(a => a.urgency === 'HIGH').length} high priority`}
                      type="count"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Low Stock Items */}
              <Card className="bg-slate-900/50 border-t border-slate-700/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-200 flex items-center text-base">
                    <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
                    Low Stock Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {lowStockItems.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center">No low stock items.</p>
                    ) : (
                      lowStockItems.map((product) => {
                        const advice = inventoryAdvice.find(a => a.product_id === product.id)
                        return (
                          <div key={product.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                            <div>
                              <h3 className="text-sm font-medium text-slate-200">{product.name}</h3>
                              <p className="text-xs text-slate-400">SKU: {product.sku}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-300">Current: {product.current_stock}</p>
                              <p className="text-xs text-red-400">
                                {advice?.advice || 'Checking stock levels...'}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card className="bg-slate-900/50 border-t border-slate-700/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-200 flex items-center text-base">
                    <Truck className="mr-2 h-5 w-5 text-blue-500" />
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactions.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center">No recent transactions.</p>
                    ) : (
                      transactions.slice(0, 5).map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                          <div>
                            <h3 className="text-sm font-medium text-slate-200">
                              {transaction.transaction_type === 'received' ? 'Stock Received' : 
                               transaction.transaction_type === 'shipped' ? 'Stock Shipped' : 'Stock Adjusted'}
                            </h3>
                            <p className="text-xs text-slate-400">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-300">Quantity: {transaction.quantity}</p>
                            <p className="text-xs text-slate-400">
                              New Stock: {transaction.new_stock}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-3">
            <div className="grid gap-3">
              {/* System time with inventory stats */}
              <Card className="bg-slate-900/50 border-t border-slate-700/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 border-b border-slate-700/50">
                    <div className="text-center">
                      <div className="text-xs text-slate-500 mb-1 font-mono">SYSTEM TIME</div>
                      <div className="text-3xl font-mono text-cyan-400 mb-1">{formatTime(currentTime)}</div>
                      <div className="text-sm text-slate-400">{formatDate(currentTime)}</div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/50 rounded-md p-3 border border-slate-700/50">
                        <div className="text-xs text-slate-500 mb-1">Total Products</div>
                        <div className="text-sm font-mono text-slate-200">{products.length}</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-md p-3 border border-slate-700/50">
                        <div className="text-xs text-slate-500 mb-1">Total Value</div>
                        <div className="text-sm font-mono text-slate-200">{formatCurrency(totalInventoryValue)}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick actions */}
              <Card className="bg-slate-900/50 border-t border-slate-700/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-200 text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <ActionButton icon={Package} label="Add Product" />
                    <ActionButton icon={Truck} label="New Transaction" />
                    <ActionButton icon={AlertTriangle} label="View Alerts" />
                    <ActionButton icon={Database} label="Export Data" />
                  </div>
                </CardContent>
              </Card>

              {/* AI Inventory Advice */}
              <Card className="bg-slate-900/50 border-t border-slate-700/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-slate-200 text-base">AI Inventory Advice</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {inventoryAdvice.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center">No advice available.</p>
                    ) : (
                      inventoryAdvice.slice(0, 3).map((advice) => {
                        const product = products.find(p => p.id === advice.product_id)
                        return (
                          <div key={advice.product_id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                            <h3 className="text-sm font-medium text-slate-200">{product?.name || "Unknown Product"}</h3>
                            <p className="text-xs text-slate-400 mt-1">{advice.advice}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <Badge variant={
                                advice.urgency === 'HIGH' ? 'destructive' :
                                advice.urgency === 'MEDIUM' ? 'secondary' : 'default'
                              }>
                                {advice.urgency}
                              </Badge>
                              <span className="text-xs text-slate-400">
                                {advice.days_of_stock.toFixed(1)} days of stock
                              </span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Component for metric cards
function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
  detail,
  type,
}: {
  title: string
  value: number
  icon: LucideIcon
  trend: "up" | "down" | "stable"
  color: string
  detail: string
  type: "count" | "percentage" | "currency"
}) {
  const getColor = () => {
    switch (color) {
      case "cyan":
        return "from-cyan-500 to-blue-500 border-cyan-500/30"
      case "green":
        return "from-green-500 to-emerald-500 border-green-500/30"
      case "blue":
        return "from-blue-500 to-indigo-500 border-blue-500/30"
      case "purple":
        return "from-purple-500 to-pink-500 border-purple-500/30"
      case "red":
        return "from-red-500 to-rose-500 border-red-500/30"
      default:
        return "from-cyan-500 to-blue-500 border-cyan-500/30"
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <BarChart3 className="h-4 w-4 text-amber-500" />
      case "down":
        return <BarChart3 className="h-4 w-4 rotate-180 text-green-500" />
      case "stable":
        return <LineChart className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const formatValue = () => {
    switch (type) {
      case "count":
        return value.toString();
      case "currency":
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case "percentage":
        return `${value}%`;
      default:
        return value.toString();
    }
  }

  return (
    <div className={`bg-slate-800/50 rounded-lg border ${getColor()} p-4 relative overflow-hidden`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-slate-400">{title}</div>
        <Icon className={`h-5 w-5 text-${color}-500`} />
      </div>
      <div className="text-2xl font-bold mb-1 bg-gradient-to-r bg-clip-text text-transparent from-slate-100 to-slate-300">
        {formatValue()}
      </div>
      <div className="text-xs text-slate-500">{detail}</div>
      <div className="absolute bottom-2 right-2 flex items-center">{getTrendIcon()}</div>
      <div className="absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-gradient-to-r opacity-20 blur-xl from-cyan-500 to-blue-500"></div>
    </div>
  )
}

// Action button component
function ActionButton({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <Button
      variant="outline"
      className="h-auto py-3 px-3 border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 flex flex-col items-center justify-center space-y-1 w-full"
    >
      <Icon className="h-5 w-5 text-cyan-500" />
      <span className="text-xs">{label}</span>
    </Button>
  )
}

// Update particle effect with null checks
function Info(props: InfoProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}

function Check(props: CheckProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}