import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Store, 
  Plus, 
  Package,
  TrendingUp,
  Settings,
  Eye,
  Edit,
  Trash2,
  Star,
  ShoppingCart,
  Clock,
  Tag,
  DollarSign,
  Users,
  Calendar,
  BarChart3
} from "lucide-react";

interface TeacherStoreManagementProps {
  classroomId: string;
}

interface StoreItem {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  currentPrice: number;
  itemType: 'physical' | 'digital' | 'privilege' | 'academic_benefit';
  category: string;
  subcategory?: string;
  inventoryType: 'unlimited' | 'limited' | 'one_time';
  totalQuantity?: number;
  availableQuantity?: number;
  maxPerStudent: number;
  isRecurring: boolean;
  recurringInterval?: 'weekly' | 'biweekly' | 'monthly';
  recurringAmount?: number;
  imageUrl?: string;
  colorTheme?: string;
  featured: boolean;
  activeStatus: boolean;
  tags: string[];
  purchaseCount?: number;
  revenue?: number;
}

interface StoreAnalytics {
  totalRevenue: number;
  totalPurchases: number;
  topCategories: Array<{ category: string; revenue: number; purchases: number }>;
}

export default function TeacherStoreManagement({ classroomId }: TeacherStoreManagementProps) {
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("inventory");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch store items
  const { data: storeItems = [], isLoading: itemsLoading } = useQuery<StoreItem[]>({
    queryKey: ["/api/store/items/classroom", classroomId],
    enabled: !!classroomId
  });

  // Fetch store analytics
  const { data: analytics } = useQuery<StoreAnalytics>({
    queryKey: ["/api/store/analytics/classroom", classroomId],
    enabled: !!classroomId
  });

  // Create store item mutation
  const createItemMutation = useMutation({
    mutationFn: async (itemData: Partial<StoreItem>) => {
      return apiRequest("/api/store/items", {
        method: "POST",
        body: JSON.stringify({ ...itemData, classroomId })
      });
    },
    onSuccess: () => {
      toast({
        title: "Store Item Created! 🎉",
        description: "Your new store item is now available to students",
        variant: "default"
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/store/items/classroom", classroomId] });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create store item. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update store item mutation
  const updateItemMutation = useMutation({
    mutationFn: async (data: { itemId: string; updates: Partial<StoreItem> }) => {
      return apiRequest(`/api/store/items/${data.itemId}`, {
        method: "PUT",
        body: JSON.stringify(data.updates)
      });
    },
    onSuccess: () => {
      toast({
        title: "Item Updated! ✅",
        description: "Store item has been successfully updated",
        variant: "default"
      });
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      queryClient.invalidateQueries({ queryKey: ["/api/store/items/classroom", classroomId] });
    }
  });

  // Delete store item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest(`/api/store/items/${itemId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      toast({
        title: "Item Deleted",
        description: "Store item has been removed from your store",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/store/items/classroom", classroomId] });
    }
  });

  const featuredItems = storeItems.filter(item => item.featured);
  const activeItems = storeItems.filter(item => item.activeStatus);
  const totalRevenue = analytics?.totalRevenue || 0;
  const totalPurchases = analytics?.totalPurchases || 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Store Management</h1>
        <p className="text-gray-600">Create and manage meaningful rewards for your students</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{storeItems.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Items</p>
                <p className="text-2xl font-bold text-green-600">{activeItems.length}</p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold text-purple-600">{totalPurchases}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tokens Earned</p>
                <p className="text-2xl font-bold text-orange-600">{totalRevenue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">
            <Package className="w-4 h-4 mr-2" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          {/* Create New Item Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Store Inventory</h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Store Item</DialogTitle>
                  <DialogDescription>
                    Add a new reward item to your classroom store
                  </DialogDescription>
                </DialogHeader>
                <StoreItemForm
                  onSubmit={(data) => createItemMutation.mutate(data)}
                  isLoading={createItemMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Store Items Grid */}
          {itemsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-32 bg-gray-200 rounded-lg mb-4" />
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : storeItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Store className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Store Items Yet</h3>
                <p className="text-gray-600 mb-4">
                  Start building your classroom store by creating your first reward item!
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Item
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {storeItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group"
                  >
                    <Card className={`border-2 transition-all duration-200 hover:shadow-lg ${
                      item.featured ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50' : 'border-gray-200'
                    }`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{item.title}</h3>
                              {item.featured && (
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-xs">
                                {item.category}
                              </Badge>
                              <Badge variant={item.activeStatus ? "default" : "destructive"} className="text-xs">
                                {item.activeStatus ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item);
                                setIsEditDialogOpen(true);
                              }}
                              data-testid={`button-edit-item-${item.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteItemMutation.mutate(item.id)}
                              className="text-red-600 hover:text-red-700"
                              data-testid={`button-delete-item-${item.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {item.description}
                        </p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Price:</span>
                            <span className="font-bold text-green-600">
                              {item.currentPrice} 🪙
                            </span>
                          </div>
                          
                          {item.inventoryType === 'limited' && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Stock:</span>
                              <span className="text-sm font-medium">
                                {item.availableQuantity}/{item.totalQuantity}
                              </span>
                            </div>
                          )}
                          
                          {item.isRecurring && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-blue-500" />
                              <span className="text-sm text-blue-600">
                                {item.recurringAmount} 🪙 / {item.recurringInterval}
                              </span>
                            </div>
                          )}
                          
                          {(item.purchaseCount !== undefined) && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Purchases:</span>
                              <span className="font-medium">{item.purchaseCount}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="text-center py-8">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
            <p className="text-gray-600">Detailed store analytics coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="text-center py-8">
            <Settings className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Store Settings</h3>
            <p className="text-gray-600">Store configuration options coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Store Item</DialogTitle>
            <DialogDescription>
              Update the details of your store item
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <StoreItemForm
              initialData={selectedItem}
              onSubmit={(data) => updateItemMutation.mutate({ itemId: selectedItem.id, updates: data })}
              isLoading={updateItemMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Store Item Form Component
interface StoreItemFormProps {
  initialData?: Partial<StoreItem>;
  onSubmit: (data: Partial<StoreItem>) => void;
  isLoading: boolean;
}

function StoreItemForm({ initialData, onSubmit, isLoading }: StoreItemFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    basePrice: initialData?.basePrice || 0,
    currentPrice: initialData?.currentPrice || 0,
    itemType: initialData?.itemType || 'physical',
    category: initialData?.category || '',
    inventoryType: initialData?.inventoryType || 'unlimited',
    totalQuantity: initialData?.totalQuantity || undefined,
    maxPerStudent: initialData?.maxPerStudent || 1,
    isRecurring: initialData?.isRecurring || false,
    recurringInterval: initialData?.recurringInterval || undefined,
    recurringAmount: initialData?.recurringAmount || undefined,
    featured: initialData?.featured || false,
    activeStatus: initialData?.activeStatus !== false,
    tags: initialData?.tags?.join(', ') || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      basePrice: Number(formData.basePrice),
      currentPrice: Number(formData.currentPrice),
      recurringAmount: formData.recurringAmount ? Number(formData.recurringAmount) : undefined,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Information */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Item Title *
          </label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter item title..."
            required
            data-testid="input-item-title"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Description *
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what students will receive..."
            rows={3}
            required
            data-testid="textarea-item-description"
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Base Price (Tokens) *
          </label>
          <Input
            type="number"
            value={formData.basePrice}
            onChange={(e) => setFormData(prev => ({ ...prev, basePrice: Number(e.target.value) }))}
            min="0"
            step="0.01"
            required
            data-testid="input-base-price"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Current Price (Tokens) *
          </label>
          <Input
            type="number"
            value={formData.currentPrice}
            onChange={(e) => setFormData(prev => ({ ...prev, currentPrice: Number(e.target.value) }))}
            min="0"
            step="0.01"
            required
            data-testid="input-current-price"
          />
        </div>
      </div>

      {/* Classification */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Item Type *
          </label>
          <Select value={formData.itemType} onValueChange={(value: any) => setFormData(prev => ({ ...prev, itemType: value }))}>
            <SelectTrigger data-testid="select-item-type">
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="physical">Physical Item</SelectItem>
              <SelectItem value="digital">Digital Item</SelectItem>
              <SelectItem value="privilege">Classroom Privilege</SelectItem>
              <SelectItem value="academic_benefit">Academic Benefit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Category *
          </label>
          <Input
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            placeholder="e.g., Rewards, Supplies, Fun"
            required
            data-testid="input-category"
          />
        </div>
      </div>

      {/* Inventory */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Inventory Type *
          </label>
          <Select value={formData.inventoryType} onValueChange={(value: any) => setFormData(prev => ({ ...prev, inventoryType: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select inventory type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unlimited">Unlimited</SelectItem>
              <SelectItem value="limited">Limited Quantity</SelectItem>
              <SelectItem value="one_time">One-Time Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {formData.inventoryType === 'limited' && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Total Quantity
            </label>
            <Input
              type="number"
              value={formData.totalQuantity || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, totalQuantity: Number(e.target.value) }))}
              min="1"
              placeholder="Enter quantity..."
            />
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={isLoading} data-testid="button-save-item">
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 mr-2"
            >
              <Package className="w-4 h-4" />
            </motion.div>
          ) : (
            <Package className="w-4 h-4 mr-2" />
          )}
          {initialData ? 'Update Item' : 'Create Item'}
        </Button>
      </div>
    </form>
  );
}