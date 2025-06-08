"use client"

import { useState, useEffect } from "react"
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

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

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<keyof Product>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    description: "",
    category: "",
    sku: "",
    unit_price: 0,
    min_stock_level: 0,
    max_stock_level: 0,
    lead_time_days: 0,
    current_stock: 0,
    reorder_point: 0,
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products/products`)
      const data = await response.json()
      setProducts(data)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching products:", error)
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

  const handleAddProduct = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/products/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProduct),
      })

      if (response.ok) {
        await fetchProducts()
        setIsAddDialogOpen(false)
        setNewProduct({
          name: "",
          description: "",
          category: "",
          sku: "",
          unit_price: 0,
          min_stock_level: 0,
          max_stock_level: 0,
          lead_time_days: 0,
          current_stock: 0,
          reorder_point: 0,
        })
      }
    } catch (error) {
      console.error("Error adding product:", error)
    }
  }

  const filteredProducts = products.filter((product) =>
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

  return (
    <div className="container mx-auto p-6">
      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-cyan-500 font-bold flex items-center">
                <Package className="mr-2 h-6 w-6" />
                Products
              </CardTitle>
              <CardDescription>
                Manage your inventory products and stock levels
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-cyan-500 hover:bg-cyan-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 text-white border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Add New Product</DialogTitle>
                  <DialogDescription className="text-slate-300">
                    Enter the product details below
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">Name</Label>
                      <Input
                        id="name"
                        className="bg-slate-800 text-white border-slate-600 focus:ring-slate-500"
                        value={newProduct.name}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sku" className="text-white">SKU</Label>
                      <Input
                        id="sku"
                        className="bg-slate-800 text-white border-slate-600 focus:ring-slate-500"
                        value={newProduct.sku}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, sku: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-white">Description</Label>
                    <Input
                      id="description"
                      className="bg-slate-800 text-white border-slate-600 focus:ring-slate-500"
                      value={newProduct.description || ""}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-white">Category</Label>
                      <Input
                        id="category"
                        className="bg-slate-800 text-white border-slate-600 focus:ring-slate-500"
                        value={newProduct.category}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            category: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit_price" className="text-white">Unit Price</Label>
                      <Input
                        id="unit_price"
                        type="number"
                        className="bg-slate-800 text-white border-slate-600 focus:ring-slate-500"
                        value={newProduct.unit_price}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            unit_price: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min_stock" className="text-white">Min Stock Level</Label>
                      <Input
                        id="min_stock"
                        type="number"
                        className="bg-slate-800 text-white border-slate-600 focus:ring-slate-500"
                        value={newProduct.min_stock_level}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            min_stock_level: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_stock" className="text-white">Max Stock Level</Label>
                      <Input
                        id="max_stock"
                        type="number"
                        className="bg-slate-800 text-white border-slate-600 focus:ring-slate-500"
                        value={newProduct.max_stock_level}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            max_stock_level: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lead_time" className="text-white">Lead Time (Days)</Label>
                      <Input
                        id="lead_time"
                        type="number"
                        className="bg-slate-800 text-white border-slate-600 focus:ring-slate-500"
                        value={newProduct.lead_time_days}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            lead_time_days: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reorder_point" className="text-white">Reorder Point</Label>
                      <Input
                        id="reorder_point"
                        type="number"
                        className="bg-slate-800 text-white border-slate-600 focus:ring-slate-500"
                        value={newProduct.reorder_point || 0}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            reorder_point: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="bg-slate-800 text-white border-slate-600 hover:bg-slate-700"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    onClick={handleAddProduct}
                  >
                    Add Product
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search products..."
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
                      Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("sku")}
                  >
                    <div className="flex items-center">
                      SKU
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("category")}
                  >
                    <div className="flex items-center">
                      Category
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("current_stock")}
                  >
                    <div className="flex items-center">
                      Stock
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("unit_price")}
                  >
                    <div className="flex items-center">
                      Price
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-slate-500">
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {product.current_stock}
                        {product.current_stock <= (product.reorder_point || product.min_stock_level) && (
                          <AlertTriangle className="ml-2 h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(product.unit_price)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.current_stock <=
                            (product.reorder_point || product.min_stock_level)
                            ? "destructive"
                            : "default"
                        }
                      >
                        {product.current_stock <=
                          (product.reorder_point || product.min_stock_level)
                          ? "Low Stock"
                          : "In Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-slate-100"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 