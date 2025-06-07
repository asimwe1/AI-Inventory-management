"use client"

import { useState, useEffect } from "react"
import {
  Truck,
  Plus,
  Search,
  ArrowUpDown,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  Settings,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Product {
  id: string
  name: string
  sku: string
  current_stock: number
}

interface Transaction {
  id: number
  product_id: string
  transaction_type: "received" | "shipped" | "adjusted"
  quantity: number
  previous_stock: number
  new_stock: number
  reference_number: string | null
  notes: string | null
  created_at: string
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<keyof Transaction>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    product_id: "",
    transaction_type: "received",
    quantity: 0,
    notes: "",
    reference_number: "",
  })

  useEffect(() => {
    fetchTransactions()
    fetchProducts()
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/inventory/inventory/transactions")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setTransactions(Array.isArray(data) ? data : [])
      setIsLoading(false)
      setError(null)
    } catch (error) {
      console.error("Error fetching transactions:", error)
      setTransactions([])
      setIsLoading(false)
      setError("Failed to fetch transactions. Please try again.")
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/inventory/inventory/status")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching products:", error)
      setProducts([])
    }
  }

  const handleSort = (field: keyof Transaction) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleAddTransaction = async () => {
    if (!newTransaction.quantity || newTransaction.quantity <= 0) {
      setError("Quantity must be greater than 0.")
      return
    }
    try {
      const endpoint = newTransaction.transaction_type === "received"
        ? "receive"
        : newTransaction.transaction_type === "shipped"
        ? "ship"
        : "adjust"
      console.log("Posting to:", `http://localhost:8000/api/inventory/inventory/${endpoint}`, "Data:", newTransaction)
      const response = await fetch(`http://localhost:8000/api/inventory/inventory/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: newTransaction.product_id,
          transaction_type: newTransaction.transaction_type,
          quantity: newTransaction.quantity,
          reference_number: newTransaction.reference_number || null,
          notes: newTransaction.notes || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("API error response:", errorData)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      await fetchTransactions()
      setIsAddDialogOpen(false)
      setNewTransaction({
        product_id: "",
        transaction_type: "received",
        quantity: 0,
        notes: "",
        reference_number: "",
      })
    } catch (error) {
      console.error("Error adding transaction:", error)
      setError("Failed to add transaction. Please try again.")
    }
  }

  const filteredTransactions = transactions
    .filter((transaction) =>
      Object.values(transaction).some((value) =>
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

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case "received":
        return <ArrowDownToLine className="h-4 w-4 text-green-500" />
      case "shipped":
        return <ArrowUpFromLine className="h-4 w-4 text-red-500" />
      case "adjusted":
        return <Settings className="h-4 w-4 text-amber-500" />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-cyan-500 font-bold flex items-center">
                <Truck className="mr-2 h-6 w-6" />
                Transactions
              </CardTitle>
              <CardDescription>
                Manage your inventory transactions and stock movements
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-cyan-500 hover:bg-cyan-600">
                  <Plus className="mr-2 h-4 w-4" />
                  New Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle>Add New Transaction</DialogTitle>
                  <DialogDescription>
                    Record a new inventory transaction
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="product">Product</Label>
                    <Select
                      value={newTransaction.product_id}
                      onValueChange={(value) =>
                        setNewTransaction({ ...newTransaction, product_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Transaction Type</Label>
                    <Select
                      value={newTransaction.transaction_type}
                      onValueChange={(value: "received" | "shipped" | "adjusted") =>
                        setNewTransaction({
                          ...newTransaction,
                          transaction_type: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="received">Stock Received</SelectItem>
                        <SelectItem value="shipped">Stock Shipped</SelectItem>
                        <SelectItem value="adjusted">Stock Adjusted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newTransaction.quantity}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          quantity: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference_number">Reference Number</Label>
                    <Input
                      id="reference_number"
                      value={newTransaction.reference_number || ""}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          reference_number: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={newTransaction.notes || ""}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddTransaction}>Add Transaction</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-500 mb-4">{error}</div>
          )}
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search transactions..."
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
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center">
                      Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort("quantity")}
                  >
                    <div className="flex items-center">
                      Quantity
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Previous Stock</TableHead>
                  <TableHead>New Stock</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const product = products.find(
                      (p) => p.id === transaction.product_id
                    )
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Package className="mr-2 h-4 w-4 text-slate-400" />
                            {product?.name || "Unknown Product"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getTransactionTypeIcon(transaction.transaction_type)}
                            <span className="ml-2">
                              {transaction.transaction_type.charAt(0).toUpperCase() +
                                transaction.transaction_type.slice(1)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.transaction_type === "received"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {transaction.transaction_type === "received" ? "+" : "-"}
                            {transaction.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.previous_stock}</TableCell>
                        <TableCell>{transaction.new_stock}</TableCell>
                        <TableCell>
                          {transaction.reference_number || "-"}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}