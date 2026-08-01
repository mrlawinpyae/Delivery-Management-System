import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Plus, Edit2, Trash2, Image as ImageIcon } from "lucide-react"
import axios from "@/lib/axios"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

// --- Types ---
interface Restaurant {
  restaurantId: string
  name: string
  phone?: string
  image: string
  address: string
}

interface MenuItem {
  itemId: string
  name: string
  description: string
  image: string
  price: number
  isAvailable: boolean
}

interface MenuFormData {
  name: string
  description: string
  image: string
  price: number | ""
  isAvailable: boolean
}

const defaultFormData: MenuFormData = {
  name: "",
  description: "",
  image: "",
  price: "",
  isAvailable: true,
}

export default function AdminRestaurantDetailsPage() {
  const { id } = useParams<{ id: string }>()
  
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState<MenuFormData>(defaultFormData)

  // Fetch Restaurant Details
  const { data: restaurant, isLoading, isError } = useQuery<Restaurant>({
    queryKey: ["admin-restaurant", id],
    queryFn: async () => {
      const { data } = await axios.get(`/restaurants/getRestaurantByID/${id}`)
      return data.data
    },
    enabled: !!id,
  })

  // MOCK: Initialize with some dummy menus since the backend isn't ready
  useEffect(() => {
    setMenus([
      {
        itemId: "menu-1",
        name: "Classic Tea",
        description: "A traditional burmese tea",
        image: "https://placehold.co/400x300?text=Tea",
        price: 1500,
        isAvailable: true,
      },
      {
        itemId: "menu-2",
        name: "Fried Rice",
        description: "Stir-fried rice with vegetables and egg",
        image: "https://placehold.co/400x300?text=Fried+Rice",
        price: 3500,
        isAvailable: false,
      }
    ])
  }, [])

  // --- Handlers ---
  const handleOpenModal = (menu?: MenuItem) => {
    if (menu) {
      setEditingMenu(menu)
      setFormData({
        name: menu.name,
        description: menu.description,
        image: menu.image,
        price: menu.price,
        isAvailable: menu.isAvailable,
      })
    } else {
      setEditingMenu(null)
      setFormData(defaultFormData)
    }
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // MOCK API CALL
    setTimeout(() => {
      if (editingMenu) {
        setMenus(prev => prev.map(m => m.itemId === editingMenu.itemId ? { ...m, ...formData, price: Number(formData.price) } : m))
        toast.success("Menu item updated successfully")
      } else {
        const newItem: MenuItem = {
          ...formData,
          itemId: `menu-${Date.now()}`,
          price: Number(formData.price),
        }
        setMenus(prev => [...prev, newItem])
        toast.success("Menu item created successfully")
      }
      setIsModalOpen(false)
    }, 500)
  }

  const handleDelete = (itemId: string) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      // MOCK API CALL
      setTimeout(() => {
        setMenus(prev => prev.filter(m => m.itemId !== itemId))
        toast.success("Menu item deleted successfully")
      }, 500)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? (value === "" ? "" : Number(value)) : value,
    }))
  }

  const handleToggleAvailable = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isAvailable: checked }))
  }

  if (isLoading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-10 w-32 bg-slate-200 rounded"></div>
      <div className="h-48 bg-slate-200 rounded-3xl"></div>
    </div>
  }

  if (isError || !restaurant) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Restaurant not found</h2>
        <Link to="/admin/restaurants">
          <Button variant="outline">Back to Restaurants</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header / Back */}
      <div className="flex items-center gap-4">
        <Link to="/admin/restaurants">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full bg-white shadow-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Restaurant Menu Management</h1>
      </div>

      {/* Restaurant Info Banner */}
      <div className="relative h-48 w-full overflow-hidden rounded-3xl shadow-sm">
        <img
          src={restaurant.image || "https://placehold.co/1200x400?text=Banner"}
          alt={restaurant.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{restaurant.name}</h2>
          <p className="mt-1 text-sm text-slate-300 flex items-center gap-2">
            <span>{restaurant.address}</span>
            {restaurant.phone && (
              <>
                <span className="h-1 w-1 rounded-full bg-slate-400"></span>
                <span>{restaurant.phone}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Menus Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 className="text-lg font-bold text-slate-900">Menu Items</h3>
          <Button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Menu Item
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {menus.map((item) => (
              <motion.div
                key={item.itemId}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="group flex h-full flex-col overflow-hidden rounded-2xl border-slate-200 shadow-sm transition-all hover:shadow-md bg-white">
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                    
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center backdrop-blur-[2px]">
                        <Badge variant="destructive" className="px-3 font-bold shadow-md">UNAVAILABLE</Badge>
                      </div>
                    )}
                    
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-full bg-white/90 shadow-sm hover:bg-white"
                        onClick={() => handleOpenModal(item)}
                      >
                        <Edit2 className="h-4 w-4 text-slate-700" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8 rounded-full shadow-sm"
                        onClick={() => handleDelete(item.itemId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <CardContent className="flex flex-1 flex-col p-5">
                    <div className="mb-4 flex-1 space-y-1">
                      <h3 className="line-clamp-1 font-serif text-lg font-bold text-slate-900">
                        {item.name}
                      </h3>
                      <p className="line-clamp-2 text-sm text-slate-500">
                        {item.description}
                      </p>
                    </div>
                    <div className="mt-auto border-t border-slate-100 pt-4">
                      <span className="font-semibold text-indigo-600 md:text-lg">
                        {item.price.toLocaleString()} <span className="text-xs text-slate-500">MMK</span>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {menus.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                No menu items found for this restaurant.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Create/Edit Menu Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingMenu ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Mohinga"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="e.g. Delicious fish broth noodle soup"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price (MMK)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 1500"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://example.com/food.jpg"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 mt-2 shadow-sm">
                <div className="space-y-0.5">
                  <Label htmlFor="available">Available Status</Label>
                  <p className="text-xs text-slate-500">Toggle whether this item is currently available for order.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.isAvailable}
                  onClick={() => handleToggleAvailable(!formData.isAvailable)}
                  className={`${
                    formData.isAvailable ? "bg-indigo-600" : "bg-slate-200"
                  } relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2`}
                >
                  <span
                    className={`${
                      formData.isAvailable ? "translate-x-6" : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
