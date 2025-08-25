import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { groupBuyTemplateData } from "@shared/schema";
import { useClassroom } from "@/contexts/ClassroomContext";
import StudentStore from "@/components/student/student-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import TemplateSelector from "@/components/store/template-selector";
import { ShoppingBag, Users, Plus, Target, Clock, Gift } from "lucide-react";

export default function Store() {
  const { user } = useAuth();
  
  // Show student store view for students
  if (user?.role === 'student') {
    return <StudentStore />;
  }
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("individual");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isGroupBuyDialogOpen, setIsGroupBuyDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', cost: 0, category: '', icon: '📦' });
  const [groupBuyForm, setGroupBuyForm] = useState({ 
    title: '', 
    description: '', 
    goalAmount: 100, 
    endsAt: '',
    minContribution: 1,
    maxContribution: 50
  });
  
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const { currentClassroom } = useClassroom();

  // Get store items
  const { data: items, isLoading } = useQuery({
    queryKey: ["/api/store/items/classroom", currentClassroom?.id],
    enabled: !!currentClassroom
  });

  // Get store templates
  const { data: templates = [] } = useQuery({
    queryKey: ["/api/store/templates"],
    enabled: !!currentClassroom
  }) as { data: any[] };

  // Get group buys for classroom
  const { data: groupBuys = [], isLoading: isGroupBuysLoading } = useQuery({
    queryKey: ["/api/group-buys/classroom", currentClassroom?.id],
    enabled: !!currentClassroom
  });

  // Create store item mutation
  const createItemMutation = useMutation({
    mutationFn: async (itemData: any) => {
      return apiRequest("POST", "/api/store/items", { ...itemData, classroomId: currentClassroom?.id });
    },
    onSuccess: () => {
      toast({
        title: "Store Item Created!",
        description: "Your new store item is now available to students",
        variant: "default"
      });
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/store/items/classroom", currentClassroom?.id] });
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
      return apiRequest("PUT", `/api/store/items/${data.itemId}`, data.updates);
    },
    onSuccess: () => {
      toast({
        title: "Item Updated!",
        description: "Store item has been successfully updated",
        variant: "default"
      });
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      queryClient.invalidateQueries({ queryKey: ["/api/store/items/classroom", currentClassroom?.id] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update store item. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete store item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest("DELETE", `/api/store/items/${itemId}`);
    },
    onSuccess: () => {
      toast({
        title: "Item Deleted!",
        description: "Store item has been removed from your store",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/store/items/classroom", currentClassroom?.id] });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete store item. Please try again.",
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

  const handleDeleteItem = (item: any) => {
    if (confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      deleteItemMutation.mutate(item.id);
    }
  };

  // Form validation for group buys
  const validateGroupBuyForm = () => {
    if (!groupBuyForm.title.trim()) {
      toast({ title: "Validation Error", description: "Group buy title is required", variant: "destructive" });
      return false;
    }
    if (!groupBuyForm.description.trim()) {
      toast({ title: "Validation Error", description: "Group buy description is required", variant: "destructive" });
      return false;
    }
    if (groupBuyForm.goalAmount <= 0) {
      toast({ title: "Validation Error", description: "Goal amount must be greater than 0", variant: "destructive" });
      return false;
    }
    if (!groupBuyForm.endsAt) {
      toast({ title: "Validation Error", description: "End date is required", variant: "destructive" });
      return false;
    }
    return true;
  };

  // Create group buy mutation
  const createGroupBuyMutation = useMutation({
    mutationFn: async (groupBuyData: any) => {
      console.log('Creating group buy with data:', groupBuyData);
      const response = await apiRequest("POST", "/api/group-buys", { 
        ...groupBuyData, 
        classroomId: currentClassroom?.id,
        endsAt: new Date(groupBuyData.endsAt).toISOString()
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Group buy creation failed:', errorData);
        throw new Error(errorData.message || 'Failed to create group buy');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Group Buy Created!",
        description: "Your group buy is now active for students to contribute",
        variant: "default"
      });
      setIsGroupBuyDialogOpen(false);
      setGroupBuyForm({ title: '', description: '', goalAmount: 0, endsAt: '', minContribution: 1, maxContribution: null });
      queryClient.invalidateQueries({ queryKey: ["/api/group-buys/classroom", currentClassroom?.id] });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create group buy. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleCreateGroupBuy = () => {
    if (!validateGroupBuyForm()) {
      return;
    }
    createGroupBuyMutation.mutate(groupBuyForm);
  };
  
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId) {
      const template = groupBuyTemplateData.find(t => t.id === templateId);
      if (template) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + template.durationDays);
        setGroupBuyForm({
          title: template.title,
          description: template.description,
          goalAmount: template.targetAmount,
          endsAt: endDate.toISOString().split('T')[0],
          minContribution: 1,
          maxContribution: 50
        });
      }
    }
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
  const displayGroupBuys = Array.isArray(groupBuys) ? groupBuys : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Store</h1>
              <p className="text-muted-foreground">{currentClassroom?.name}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20">
            <TabsTrigger value="individual" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
              <ShoppingBag className="w-4 h-4" />
              Individual Items ({displayItems.length})
            </TabsTrigger>
            <TabsTrigger value="group-buys" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
              <Users className="w-4 h-4" />
              Group Buys ({displayGroupBuys.length})
            </TabsTrigger>
          </TabsList>

          {/* Individual Items Tab */}
          <TabsContent value="individual" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Individual Items</h2>
                <p className="text-sm text-muted-foreground">Items students can purchase individually</p>
              </div>
              {user?.role === 'teacher' && (
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg" data-testid="button-add-item">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <Plus className="w-4 h-4 text-white" />
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
              <Card className="p-12 text-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">No Items Yet</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {user?.role === 'teacher' 
                    ? "Add your first store item to get started."
                    : "Check back later for new items!"
                  }
                </p>
              </Card>
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
                      data-testid={`store-item-${index}`}
                    >
                      <Card className="overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                        <CardContent className="p-6 h-full flex flex-col">
                          {/* Header Section */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="w-14 h-14 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl">{itemIcon}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight mb-2">{item.name}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {item.category}
                                </Badge>
                              </div>
                            </div>
                            {user?.role === 'teacher' && (
                              <div className="flex gap-1 flex-shrink-0 ml-2">
                                <Button size="sm" variant="ghost" onClick={() => handleEditItem(item)} className="p-2 h-8 w-8">
                                  <i className="fas fa-edit text-blue-600 text-sm"></i>
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item)} className="p-2 h-8 w-8">
                                  <i className="fas fa-trash text-red-600 text-sm"></i>
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {/* Description Section */}
                          <div className="mb-6 flex-1">
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                              {item.description}
                            </p>
                          </div>
                          
                          {/* Price and Action Section */}
                          <div className="mt-auto space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Price</span>
                                <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                                  {item.cost} tokens
                                </span>
                              </div>
                              {user?.role !== 'teacher' && (
                                <Button 
                                  size="sm"
                                  disabled={!isActive || (user?.tokens || 0) < item.cost}
                                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2"
                                >
                                  {(user?.tokens || 0) >= item.cost ? 'Buy Now' : 'Insufficient Tokens'}
                                </Button>
                              )}
                            </div>
                            
                            {/* Status Indicators */}
                            <div className="flex items-center justify-between">
                              {!isActive ? (
                                <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  <i className="fas fa-pause mr-1 text-xs"></i>
                                  Inactive
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  <i className="fas fa-check mr-1 text-xs"></i>
                                  Available
                                </Badge>
                              )}
                              {user?.role !== 'teacher' && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Your balance: {user?.tokens || 0} tokens
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Group Buys Tab */}
          <TabsContent value="group-buys" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Group Buys</h2>
                <p className="text-sm text-muted-foreground">Collective purchases where students can contribute together</p>
              </div>
              {user?.role === 'teacher' && (
                <Dialog open={isGroupBuyDialogOpen} onOpenChange={setIsGroupBuyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Group Buy
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        Create Group Buy
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <Input
                          value={groupBuyForm.title}
                          onChange={(e) => setGroupBuyForm(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter group buy title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <Textarea
                          value={groupBuyForm.description}
                          onChange={(e) => setGroupBuyForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe what you're raising tokens for"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Goal Amount (tokens)</label>
                          <Input
                            type="number"
                            value={groupBuyForm.goalAmount}
                            onChange={(e) => setGroupBuyForm(prev => ({ ...prev, goalAmount: parseInt(e.target.value) || 0 }))}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">End Date</label>
                          <Input
                            type="date"
                            value={groupBuyForm.endsAt}
                            onChange={(e) => setGroupBuyForm(prev => ({ ...prev, endsAt: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleCreateGroupBuy} disabled={createGroupBuyMutation.isPending} className="flex-1">
                          {createGroupBuyMutation.isPending ? 'Creating...' : 'Create Group Buy'}
                        </Button>
                        <Button variant="outline" onClick={() => setIsGroupBuyDialogOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {displayGroupBuys.length === 0 ? (
              <Card className="p-12 text-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20">
                <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">No Group Buys Yet</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {user?.role === 'teacher' 
                    ? "Create your first group buy to let students contribute together."
                    : "Check back later for group buying opportunities!"
                  }
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayGroupBuys.map((groupBuy: any, index: number) => (
                  <motion.div
                    key={groupBuy.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.3) }}
                  >
                    <Card className="overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">{groupBuy.title}</h3>
                            <Badge variant={groupBuy.status === 'active' ? 'default' : 'secondary'}>
                              {groupBuy.status}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              {groupBuy.currentAmount} / {groupBuy.goalAmount} tokens
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.round((groupBuy.currentAmount / groupBuy.goalAmount) * 100)}% funded
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{groupBuy.description}</p>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((groupBuy.currentAmount / groupBuy.goalAmount) * 100, 100)}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            Ends {new Date(groupBuy.endsAt).toLocaleDateString()}
                          </div>
                          {user?.role !== 'teacher' && groupBuy.status === 'active' && (
                            <Button size="sm" className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white">
                              Contribute
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

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
    </div>
  );
}
