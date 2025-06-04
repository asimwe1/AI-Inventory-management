"use client"

import { useState, useEffect } from "react"
import {
  AlertTriangle,
  Search,
  ArrowUpDown,
  Package,
  Cpu,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface Product {
  id: string
  name: string
  sku: string
  current_stock: number
  min_stock_level: number
  max_stock_level: number
  lead_time_days: number
  reorder_point: number | null
}

interface InventoryAdvice {
  product_id: string
  advice: string
  order_quantity: number
  reorder_point: number
  days_of_stock: number
  urgency: "HIGH" | "MEDIUM" | "LOW"
}

export default function AlertsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [inventoryAdvice, setInventoryAdvice] = useState<InventoryAdvice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<keyof Product>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch products
      const productsResponse = await fetch("http://localhost:8000/products")
      const productsData = await productsResponse.json()
      setProducts(productsData)

      // Fetch inventory advice
      const advicePromises = productsData.map((product: Product) =>
        fetch("http://localhost:8000/predictions/advice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: product.id,
            current_stock: product.current_stock,
          }),
        }).then((res) => res.json())
      )
      const adviceData = await Promise.all(advicePromises)
      setInventoryAdvice(adviceData)

      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching data:", error)
      setIsLoading(false)
    }
  }

  const handleSort = (field: keyof Product) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getLowStockProducts = () => {
    return products.filter(
      (product) =>
        product.current_stock <= (product.reorder_point || product.min_stock_level)
    )
  }

  const filteredProducts = getLowStockProducts()
    .filter((product) =>
      Object.values(product).some((value) =>
        value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      if (aValue === null) return 1
      if (bValue === null) return -1
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      return sortDirection === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number)
    })

  const getStockLevelPercentage = (product: Product) => {
    const max = product.max_stock_level
    const current = product.current_stock
    return (current / max) * 100
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "HIGH":
        return "text-red-500"
      case "MEDIUM":
        return "text-amber-500"
      case "LOW":
        return "text-green-500"
      default:
        return "text-slate-400"
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                High Priority Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  inventoryAdvice.filter((advice) => advice.urgency === "HIGH")
                    .length
                }
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Items requiring immediate attention
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="mr-2 h-4 w-4 text-amber-500" />
                Medium Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  inventoryAdvice.filter((advice) => advice.urgency === "MEDIUM")
                    .length
                }
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Items to monitor closely
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                Low Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  inventoryAdvice.filter((advice) => advice.urgency === "LOW")
                    .length
                }
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Items with sufficient stock
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Items Table */}
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center">
                  <AlertTriangle className="mr-2 h-6 w-6 text-amber-500" />
                  Low Stock Items
                </CardTitle>
                <CardDescription>
                  Monitor items that need attention
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="relative w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 bg-slate-800/50 border-slate-700"
                />
              </div>
            </div>
            <div className="rounded-md border border-slate-700">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800/50">
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Product
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>AI Recommendation</TableHead>
                    <TableHead>Urgency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const advice = inventoryAdvice.find(
                      (a) => a.product_id === product.id
                    )
                    const stockLevel = getStockLevelPercentage(product)
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Package className="mr-2 h-4 w-4 text-slate-400" />
                            {product.name}
                          </div>
                        </TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {product.current_stock}
                            <span className="text-xs text-slate-400 ml-1">
                              / {product.max_stock_level}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-full">
                            <Progress
                              value={stockLevel}
                              className="h-2 bg-slate-700"
                            />
                            <div className="text-xs text-slate-400 mt-1">
                              {stockLevel.toFixed(1)}% of max stock
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Cpu className="mr-2 h-4 w-4 text-cyan-500" />
                            <span className="text-sm">
                              {advice?.advice || "Analyzing..."}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              advice?.urgency === "HIGH"
                                ? "destructive"
                                : advice?.urgency === "MEDIUM"
                                ? "secondary"
                                : "default"
                            }
                          >
                            {advice?.urgency || "Analyzing"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center">
              <Cpu className="mr-2 h-6 w-6 text-cyan-500" />
              AI Inventory Recommendations
            </CardTitle>
            <CardDescription>
              Smart suggestions for inventory management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventoryAdvice.map((advice) => {
                const product = products.find((p) => p.id === advice.product_id)
                return (
                  <div
                    key={advice.product_id}
                    className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-slate-200">
                        {product?.name}
                      </h3>
                      <Badge
                        variant={
                          advice.urgency === "HIGH"
                            ? "destructive"
                            : advice.urgency === "MEDIUM"
                            ? "secondary"
                            : "default"
                        }
                      >
                        {advice.urgency}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">
                      {advice.advice}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-slate-500">Order Quantity</div>
                        <div className="text-slate-200">
                          {advice.order_quantity} units
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">Days of Stock</div>
                        <div className="text-slate-200">
                          {advice.days_of_stock.toFixed(1)} days
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 