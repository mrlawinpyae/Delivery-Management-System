import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Plus, Edit2, Trash2, Image as ImageIcon, Upload, Loader2 } from "lucide-react"
import axios from "@/lib/axios"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// --- Types ---
interface Restaurant {
  restaurantId?: string
  id?: string
  _id?: string
  name: string
  phone?: string
  image: string
  address: string
  menu?: MenuItem[]
  menuItems?: MenuItem[]
  items?: MenuItem[]
}

interface MenuItem {
  itemId?: string
  id?: string
  _id?: string
  name: string
  description: string
  image: string
  category: string
  price: number
  isAvailable: boolean
}

interface MenuFormData {
  name: string
  description: string
  image: string
  category: string
  price: number | ""
  isAvailable: boolean
}

const CATEGORY_OPTIONS = [
  { value: "food", label: "food" },
  { value: "drinks", label: "drinks" },
  { value: "desserts", label: "desserts" },
]

const defaultFormData: MenuFormData = {
  name: "",
  description: "",
  image: "",
  category: "food",
  price: "",
  isAvailable: true,
}

export default function AdminRestaurantDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState<MenuFormData>(defaultFormData)
  const [menuToDelete, setMenuToDelete] = useState<MenuItem | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Fetch Restaurant Details & Menus
  const { data: restaurant, isLoading, isError } = useQuery<Restaurant>({
    queryKey: ["admin-restaurant-details", id],
    queryFn: async () => {
      try {
        const { data } = await axios.get(`/restaurants/${id}`)
        return data.data
      } catch {
        const { data } = await axios.get(`/restaurants/getRestaurantByID/${id}`)
        return data.data
      }
    },
    enabled: !!id,
  })

  // Extract menu items from restaurant object
  const menus: MenuItem[] = Array.isArray(restaurant)
    ? restaurant
    : restaurant?.menu || restaurant?.menuItems || restaurant?.items || []

  // Create Menu Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await axios.post(`/restaurants/${id}/menu`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-restaurant-details", id] })
      queryClient.invalidateQueries({ queryKey: ["restaurant", id] })
      toast.success("Menu item created successfully")
      setIsModalOpen(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create menu item")
    },
  })

  // Update Menu Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ itemId, payload }: { itemId: string; payload: any }) => {
      const { data } = await axios.put(`/restaurants/${id}/menu/${itemId}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-restaurant-details", id] })
      queryClient.invalidateQueries({ queryKey: ["restaurant", id] })
      toast.success("Menu item updated successfully")
      setIsModalOpen(false)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update menu item")
    },
  })

  // Delete Menu Mutation
  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await axios.delete(`/restaurants/${id}/menu/${itemId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-restaurant-details", id] })
      queryClient.invalidateQueries({ queryKey: ["restaurant", id] })
      toast.success("Menu item deleted successfully")
      setMenuToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete menu item")
    },
  })

  // Handlers
  const handleOpenModal = (menu?: MenuItem) => {
    if (menu) {
      setEditingMenu(menu)
      setFormData({
        name: menu.name || "",
        description: menu.description || "",
        image: menu.image || "",
        category: menu.category ? menu.category.toLowerCase() : "food",
        price: menu.price ?? "",
        isAvailable: menu.isAvailable ?? true,
      })
    } else {
      setEditingMenu(null)
      setFormData(defaultFormData)
    }
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.name.trim()) {
      toast.error("Please enter an item name.")
      return
    }

    if (!formData.category) {
      toast.error("Please select a category.")
      return
    }

    if (formData.price === "" || formData.price === null || formData.price === undefined) {
      toast.error("Please enter a price.")
      return
    }

    const priceNum = Number(formData.price)
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Please enter a valid price greater than zero.")
      return
    }

    if (isUploadingImage) {
      toast.error("Please wait for the image upload to complete.")
      return
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      image: formData.image,
      category: formData.category,
      price: priceNum,
      isAvailable: formData.isAvailable,
    }

    if (editingMenu) {
      const itemId = editingMenu.itemId || editingMenu.id || editingMenu._id || ""
      updateMutation.mutate({ itemId, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const confirmDelete = () => {
    if (!menuToDelete) return
    const itemId = menuToDelete.itemId || menuToDelete.id || menuToDelete._id || ""
    deleteMutation.mutate(itemId)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? (value === "" ? "" : Number(value)) : value,
    }))
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB")
      return
    }

    const uploadFormData = new FormData()
    uploadFormData.append("file", file)

    setIsUploadingImage(true)
    const toastId = toast.loading("Uploading image...")

    try {
      const response = await axios.post("/images/upload", uploadFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      const uploadedUrl =
        typeof response.data === "string"
          ? response.data
          : (response.data?.url ||
             response.data?.data?.url ||
             response.data?.img ||
             response.data?.image ||
             "")

      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, image: uploadedUrl }))
        toast.success("Image uploaded successfully", { id: toastId })
      } else {
        toast.error("Failed to parse uploaded image URL", { id: toastId })
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Failed to upload image", { id: toastId })
    } finally {
      setIsUploadingImage(false)
      e.target.value = ""
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-32 bg-slate-200 rounded"></div>
        <div className="h-48 bg-slate-200 rounded-3xl"></div>
      </div>
    )
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
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full bg-white shadow-sm cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-slate-900">
          Restaurant Menu Management
        </h1>
      </div>

      {/* Restaurant Info Banner */}
      <div className="relative h-48 w-full overflow-hidden rounded-3xl shadow-sm">
        <img
          src={restaurant.image || "https://placehold.co/1200x400?text=Banner"}
          alt={restaurant.name}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 text-white md:p-8">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            {restaurant.name}
          </h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-300">
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
          <Button
            onClick={() => handleOpenModal()}
            className="cursor-pointer bg-indigo-600 font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Menu Item
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {menus.map((item, idx) => {
              const itemId = item.itemId || item.id || item._id || `menu-${idx}`
              return (
                <motion.div
                  key={itemId}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="group flex h-full flex-col gap-0 overflow-hidden rounded-2xl bg-white p-0 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md hover:ring-slate-300">
                    <div className="relative h-48 w-full shrink-0 overflow-hidden bg-slate-50">
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
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px]">
                          <Badge
                            variant="destructive"
                            className="px-3 font-bold shadow-md"
                          >
                            UNAVAILABLE
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="flex flex-1 flex-col p-5">
                      <div className="mb-4 flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="line-clamp-1 font-serif text-lg font-bold text-slate-900">
                            {item.name}
                          </h3>
                          {item.category && (
                            <Badge
                              variant="outline"
                              className="shrink-0 border-indigo-200 bg-indigo-50 text-[11px] font-medium text-indigo-700 capitalize"
                            >
                              {item.category}
                            </Badge>
                          )}
                        </div>
                        <p className="line-clamp-2 text-sm text-slate-500">
                          {item.description}
                        </p>
                      </div>
                      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                        <span className="font-semibold text-indigo-600 md:text-lg">
                          {Number(item.price || 0).toLocaleString()}{" "}
                          <span className="text-xs text-slate-500">MMK</span>
                        </span>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                            onClick={() => handleOpenModal(item)}
                            title="Edit Menu Item"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                            onClick={() => setMenuToDelete(item)}
                            title="Delete Menu Item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
            {menus.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                No menu items found for this restaurant. Click "Add Menu Item"
                to create one.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Create/Edit Menu Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xl sm:max-w-[480px]">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-4"
          >
            <DialogHeader className="border-b border-slate-100 pb-1">
              <DialogTitle className="text-lg font-bold text-slate-900">
                {editingMenu ? "Edit Menu Item" : "Add Menu Item"}
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-3.5 pt-1">
              {/* Item Name */}
              <div className="space-y-1">
                <Label
                  htmlFor="name"
                  className="text-xs font-semibold text-slate-700"
                >
                  Item Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Mohinga"
                  className="h-9 rounded-md border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Category Select Box */}
              <div className="space-y-1">
                <Label
                  htmlFor="category"
                  className="text-xs font-semibold text-slate-700"
                >
                  Category
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, category: val }))
                  }
                >
                  <SelectTrigger
                    id="category"
                    className="h-9 w-full rounded-md border-slate-300 bg-white text-sm text-slate-900 data-[placeholder]:text-slate-400"
                  >
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="z-50 border-slate-200 bg-white text-slate-900 shadow-md">
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="cursor-pointer text-slate-900 focus:bg-slate-100 focus:text-slate-900"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label
                  htmlFor="description"
                  className="text-xs font-semibold text-slate-700"
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="e.g. Delicious traditional Myanmar dish"
                  className="resize-none rounded-md border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Price */}
              <div className="space-y-1">
                <Label
                  htmlFor="price"
                  className="text-xs font-semibold text-slate-700"
                >
                  Price (MMK)
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="1"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g. 1500"
                  className="h-9 rounded-md border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Image Upload (File Only) */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Menu Image
                </Label>
                <div className="flex items-center gap-3">
                  <div className="relative flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                    {formData.image ? (
                      <img
                        src={formData.image}
                        alt="Menu Item Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon className="h-5 w-5" />
                        <span className="text-[9px] font-medium">No Image</span>
                      </div>
                    )}
                    {isUploadingImage && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white backdrop-blur-[1px]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-1">
                    <label className="inline-flex w-fit cursor-pointer items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition-colors hover:bg-slate-50">
                      <Upload className="h-3.5 w-3.5 text-slate-500" />
                      <span>
                        {formData.image ? "Change Image" : "Upload Image"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-500">
                      JPG, PNG, or WEBP up to 2MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Availability Toggle */}
              <div className="mt-1 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50/50 p-3">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="available"
                    className="cursor-pointer text-xs font-semibold text-slate-700"
                  >
                    Available Status
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Toggle whether this item is currently available for order.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.isAvailable}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      isAvailable: !prev.isAvailable,
                    }))
                  }
                  className={`${
                    formData.isAvailable ? "bg-slate-900" : "bg-slate-200"
                  } relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:outline-none`}
                >
                  <span
                    className={`${
                      formData.isAvailable ? "translate-x-5.5" : "translate-x-1"
                    } inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform`}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-md border-slate-300 bg-white px-4 text-xs font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 rounded-md bg-slate-900 px-5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-slate-800 disabled:opacity-50"
                disabled={
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  isUploadingImage
                }
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!menuToDelete}
        onOpenChange={(open) => !open && setMenuToDelete(null)}
      >
        <AlertDialogContent className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:max-w-[400px]">
          <AlertDialogHeader className="space-y-3 text-center sm:text-left">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 sm:mx-0">
              <Trash2 className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-slate-900">
              Delete Menu Item?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed text-slate-500">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">
                "{menuToDelete?.name}"
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex gap-2 sm:gap-3">
            <AlertDialogCancel className="h-10 rounded-xl border-slate-200 font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="h-10 rounded-xl bg-rose-600 font-medium text-white shadow-xs transition-all hover:bg-rose-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Item"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

