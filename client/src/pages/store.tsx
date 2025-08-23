import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import TemplateSelector from "@/components/store/template-selector";

export default function Store() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', cost: 0, category: '', icon: '📦' });

  // Get user's classrooms
  const { data: classrooms } = useQuery({
    queryKey: ["/api/classrooms"],
    enabled: !!user
  });

  const currentClassroom = classrooms?.[0] || null;

  // Get store items
  const { data: items, isLoading } = useQuery({
    queryKey: ["/api/classrooms", currentClassroom?.id, "store"],
    enabled: !!currentClassroom
  });

  // Get store templates
  const { data: templates = [] } = useQuery({
    queryKey: ["/api/store/templates"],
    enabled: !!currentClassroom
  }) as { data: any[] };

  // Create store item mutation
  const createItemMutation = useMutation({
    mutationFn: async (itemData: any) => {
      const response = await apiRequest("POST", "/api/store-items", { ...itemData, classroomId: currentClassroom?.id });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Store Item Created!",
        description: "Your new store item is now available to students",
        variant: "default"
      });
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms", currentClassroom?.id, "store"] });
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
    mutationFn: async (data: { itemId: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/store-items/${data.itemId}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Item Updated!",
        description: "Store item has been successfully updated",
        variant: "default"
      });
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms", currentClassroom?.id, "store"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update store item. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleCreateItem = (itemData: any) => {
    createItemMutation.mutate(itemData);
  };

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setEditForm({
      name: item.name || '',
      description: item.description || '',
      cost: item.cost || 0,
      category: item.category || '',
      icon: item.metadata?.icon || '📦'
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateItem = () => {
    if (!selectedItem) return;
    updateItemMutation.mutate({
      itemId: selectedItem.id,
      updates: {
        name: editForm.name,
        description: editForm.description,
        cost: editForm.cost,
        category: editForm.category,
        metadata: { icon: editForm.icon }
      }
    });
  };

  const getItemIcon = (item: any) => {
    return item.metadata?.icon || '📦';
  };

  if (!currentClassroom) {
    return (
      <div className="p-4 lg:p-6">
        <div className="text-center py-12">
          <i className="fas fa-store text-4xl text-gray-400 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Classroom Found</h3>
          <p className="text-gray-600">Create a classroom to manage the store.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-3"></div>
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayItems = Array.isArray(items) ? items : [];

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Store</h1>
          <p className="text-gray-600">{currentClassroom?.name} • {displayItems.length} items</p>
        </div>
        
        {user?.role === 'teacher' && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-item">
                <i className="fas fa-plus mr-2"></i>
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-plus text-white text-sm"></i>
                  </div>
                  Add Store Item
                </DialogTitle>
              </DialogHeader>
              <TemplateSelector
                templates={templates}
                onSubmit={handleCreateItem}
                isLoading={createItemMutation.isPending}
                classroomId={currentClassroom?.id || ''}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {displayItems.length === 0 ? (
        <div className="text-center py-12">
          <i className="fas fa-shopping-bag text-4xl text-gray-400 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Items Yet</h3>
          <p className="text-gray-600 mb-4">
            {user?.role === 'teacher' 
              ? "Add your first store item to get started."
              : "Check back later for new items!"
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayItems.map((item: any, index: number) => {
            const itemIcon = getItemIcon(item);
            const isActive = item.isActive !== false;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.3) }}
                className={`rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 group overflow-hidden bg-white border-2 hover:border-4 ${
                  item.category === 'Rewards' 
                    ? 'border-purple-300 hover:border-purple-500'
                    : item.category === 'Supplies'
                    ? 'border-blue-300 hover:border-blue-500'
                    : 'border-green-300 hover:border-green-500'
                } hover:-translate-y-1`}
                data-testid={`store-item-${index}`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        item.category === 'Rewards' 
                          ? 'bg-purple-100'
                          : item.category === 'Supplies'
                          ? 'bg-blue-100'
                          : 'bg-green-100'
                      }`}>
                        <span className="text-3xl" data-testid={`item-icon-${index}`}>
                          {itemIcon}
                        </span>
                      </div>
                      <h3 className={`text-xl font-bold ${
                        item.category === 'Rewards' 
                          ? 'text-purple-700'
                          : item.category === 'Supplies'
                          ? 'text-blue-700'
                          : 'text-green-700'
                      }`} data-testid={`item-name-${index}`}>
                        {item.name}
                      </h3>
                    </div>
                    
                    {user?.role === 'teacher' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={isActive ? "secondary" : "outline"}
                          className="rounded-full p-2"
                          data-testid={`button-toggle-${index}`}
                        >
                          <i className={`fas fa-power-off ${isActive ? 'text-green-600' : 'text-red-600'}`}></i>
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4" data-testid={`item-description-${index}`}>
                    {item.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-2xl font-bold ${
                      item.category === 'Rewards' 
                        ? 'text-purple-600'
                        : item.category === 'Supplies'
                        ? 'text-blue-600'
                        : 'text-green-600'
                    }`} data-testid={`item-cost-${index}`}>
                      {item.cost} tokens
                    </span>
                    
                    {!isActive && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {item.category && (
                      <Badge variant="outline" className={`${
                        item.category === 'Rewards' 
                          ? 'text-purple-700 border-purple-300'
                          : item.category === 'Supplies'
                          ? 'text-blue-700 border-blue-300'
                          : 'text-green-700 border-green-300'
                      }`} data-testid={`item-category-${index}`}>
                        {item.category}
                      </Badge>
                    )}
                    
                    <div className="flex gap-2">
                      {user?.role === 'teacher' ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditItem(item)}
                          data-testid={`button-edit-item-${index}`}
                          className={`${
                            item.category === 'Rewards' 
                              ? 'border-purple-300 text-purple-700 hover:bg-purple-50'
                              : item.category === 'Supplies'
                              ? 'border-blue-300 text-blue-700 hover:bg-blue-50'
                              : 'border-green-300 text-green-700 hover:bg-green-50'
                          }`}
                        >
                          <i className="fas fa-edit mr-1"></i>
                          Edit
                        </Button>
                      ) : (
                        <Button 
                          size="sm"
                          disabled={!isActive || (user?.tokens || 0) < item.cost}
                          data-testid={`button-buy-item-${index}`}
                          className={`${
                            item.category === 'Rewards' 
                              ? 'bg-purple-500 hover:bg-purple-600'
                              : item.category === 'Supplies'
                              ? 'bg-blue-500 hover:bg-blue-600'
                              : 'bg-green-500 hover:bg-green-600'
                          } text-white`}
                        >
                          {(user?.tokens || 0) >= item.cost ? 'Buy' : 'Not enough tokens'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-edit text-white text-sm"></i>
              </div>
              Edit Store Item
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter item name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Enter item description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost (tokens)</label>
                <Input
                  type="number"
                  value={editForm.cost}
                  onChange={(e) => setEditForm({ ...editForm, cost: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <Select value={editForm.category} onValueChange={(value) => setEditForm({ ...editForm, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Supplies">Supplies</SelectItem>
                    <SelectItem value="Rewards">Rewards</SelectItem>
                    <SelectItem value="Privileges">Privileges</SelectItem>
                    <SelectItem value="Academic">Academic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{editForm.icon}</span>
                <Input
                  value={editForm.icon}
                  onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                  placeholder="📦"
                  className="w-20"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Use any emoji as an icon</p>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdateItem} disabled={updateItemMutation.isPending} className="flex-1">
                {updateItemMutation.isPending ? 'Updating...' : 'Update Item'}
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
