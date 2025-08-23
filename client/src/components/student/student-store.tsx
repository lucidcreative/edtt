import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface StoreItem {
  id: string;
  name: string;
  title?: string; // For backward compatibility
  description?: string;
  category: string;
  cost: number;
  imageUrl?: string;
  isAvailable: boolean;
  quantity?: number;
  inventory?: number;
}

interface Purchase {
  id: string;
  storeItemId: string;
  cost: number;
  purchasedAt: string;
  storeItem: StoreItem;
}

const categories = [
  { value: "privileges", label: "Privileges", icon: "fas fa-crown", color: "bg-yellow-100 text-yellow-600" },
  { value: "supplies", label: "Supplies", icon: "fas fa-pen", color: "bg-blue-100 text-blue-600" },
  { value: "rewards", label: "Rewards", icon: "fas fa-gift", color: "bg-green-100 text-green-600" },
  { value: "experiences", label: "Experiences", icon: "fas fa-star", color: "bg-purple-100 text-purple-600" },
];

export default function StudentStore() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);

  // Get available store items
  const { data: storeItems = [], isLoading, error } = useQuery<StoreItem[]>({
    queryKey: ["/api/students", user?.id, "store-items"],
    enabled: !!user?.id && user?.role === 'student'
  });


  // Get student's purchase history
  const { data: purchases = [] } = useQuery<Purchase[]>({
    queryKey: ["/api/students", user?.id, "purchases"],
    enabled: !!user?.id && user?.role === 'student'
  });

  // Purchase item mutation
  const purchaseItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest('POST', `/api/store/${itemId}/purchase`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Purchase Successful", description: "Item purchased successfully! Check your inventory." });
      queryClient.invalidateQueries({ queryKey: ["/api/students", user?.id, "store-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students", user?.id, "purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }); // Refresh user tokens
      setIsPurchaseDialogOpen(false);
      setSelectedItem(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Purchase Failed", 
        description: error.message || "Not enough tokens or item unavailable.", 
        variant: "destructive" 
      });
    }
  });

  const handlePurchaseItem = () => {
    if (!selectedItem) return;
    purchaseItemMutation.mutate(selectedItem.id);
  };

  const filteredItems = selectedCategory === "all" 
    ? storeItems 
    : storeItems.filter(item => item.category === selectedCategory);

  const getCategoryInfo = (category: string) => {
    return categories.find(cat => cat.value === category) || { label: category, icon: "fas fa-box", color: "bg-gray-100 text-gray-600" };
  };

  const canAfford = (cost: number) => {
    return (user?.tokens || 0) >= cost;
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Token Store</h1>
            <p className="text-gray-600 mt-1">Spend your earned tokens on rewards and privileges!</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-600 flex items-center gap-2">
              <i className="fas fa-coins"></i>
              {user?.tokens || 0}
            </div>
            <p className="text-sm text-gray-600">Available Tokens</p>
          </div>
        </div>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-wrap gap-2"
      >
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          onClick={() => setSelectedCategory("all")}
          className="mb-2"
          data-testid="filter-all-items"
        >
          All Items
        </Button>
        {categories.map((category) => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? "default" : "outline"}
            onClick={() => setSelectedCategory(category.value)}
            className="mb-2"
            data-testid={`filter-${category.value}-items`}
          >
            <i className={`${category.icon} mr-2`}></i>
            {category.label}
          </Button>
        ))}
      </motion.div>

      {/* Store Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item, index) => {
            const categoryInfo = getCategoryInfo(item.category);
            const affordable = canAfford(item.cost);
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className={`relative overflow-hidden hover:shadow-xl transition-all duration-300 group ${!affordable ? 'opacity-60' : ''} ${affordable ? 'hover:-translate-y-1' : ''}`}>
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <Badge variant="outline" className={`${categoryInfo.color} border-0 shadow-sm`}>
                      <i className={`${categoryInfo.icon} mr-1 text-xs`}></i>
                      {categoryInfo.label}
                    </Badge>
                  </div>
                  
                  {/* Status Badge */}
                  {!item.isAvailable && (
                    <div className="absolute top-3 right-3 z-10">
                      <Badge variant="destructive" className="shadow-sm">
                        <i className="fas fa-times mr-1 text-xs"></i>
                        Out of Stock
                      </Badge>
                    </div>
                  )}
                  
                  {/* Icon Display */}
                  <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <div className="text-6xl group-hover:scale-110 transition-transform duration-300">
                        {item.imageUrl}
                      </div>
                    ) : (
                      <div className="text-5xl text-gray-300 group-hover:scale-110 transition-transform duration-300">
                        <i className={categoryInfo.icon}></i>
                      </div>
                    )}
                    
                    {/* Price Overlay */}
                    <div className="absolute bottom-0 right-0 bg-white/90 backdrop-blur-sm rounded-tl-xl px-3 py-2">
                      <div className={`text-lg font-bold flex items-center gap-1 ${affordable ? 'text-yellow-600' : 'text-red-500'}`}>
                        <i className="fas fa-coins text-sm"></i>
                        {item.cost}
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-4 space-y-3">
                    {/* Title */}
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800 group-hover:text-blue-600 transition-colors leading-tight">
                        {item.name || item.title}
                      </h3>
                      {(item.quantity || item.inventory) && item.inventory !== -1 && (
                        <p className="text-xs text-gray-500 mt-1">Available: {item.quantity || item.inventory}</p>
                      )}
                    </div>
                    
                    {/* Description */}
                    {item.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button 
                        className={`flex-1 font-medium ${!affordable || !item.isAvailable ? 'h-9' : 'h-10'}`}
                        disabled={!affordable || !item.isAvailable}
                        onClick={() => {
                          setSelectedItem(item);
                          setIsPurchaseDialogOpen(true);
                        }}
                        data-testid={`button-buy-${item.id}`}
                        variant={affordable && item.isAvailable ? "default" : "secondary"}
                      >
                        {!affordable ? (
                          <>
                            <i className="fas fa-ban mr-2 text-xs"></i>
                            <span className="text-xs">Not Enough Tokens</span>
                          </>
                        ) : !item.isAvailable ? (
                          <>
                            <i className="fas fa-times mr-2 text-xs"></i>
                            <span className="text-xs">Out of Stock</span>
                          </>
                        ) : (
                          <>
                            <i className="fas fa-shopping-cart mr-2"></i>
                            Buy Now
                          </>
                        )}
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-10 w-10 p-0">
                            <i className="fas fa-eye text-sm"></i>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <i className={`${categoryInfo.icon} text-lg`}></i>
                              {item.name || item.title}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {item.imageUrl && (
                              <div className="w-full h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                                <div className="text-8xl">
                                  {item.imageUrl}
                                </div>
                              </div>
                            )}
                            
                            {item.description && (
                              <div>
                                <h4 className="text-sm font-medium mb-2">Description</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between pt-4 border-t">
                              <Badge variant="outline" className={categoryInfo.color}>
                                <i className={`${categoryInfo.icon} mr-1`}></i>
                                {categoryInfo.label}
                              </Badge>
                              <div className="text-xl font-bold text-yellow-600 flex items-center gap-1">
                                <i className="fas fa-coins"></i>
                                {item.cost} tokens
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-store text-3xl text-white"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Items Available</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {selectedCategory === "all" 
              ? "Your teacher hasn't added any store items yet. Check back soon!"
              : `No ${categories.find(c => c.value === selectedCategory)?.label} items available.`
            }
          </p>
        </motion.div>
      )}

      {/* Recent Purchases */}
      {purchases.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-history text-blue-500"></i>
                Recent Purchases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {purchases.slice(0, 5).map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <i className="fas fa-shopping-bag text-blue-600"></i>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{purchase.storeItem.title}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(purchase.purchasedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-red-600 flex items-center gap-1">
                        <i className="fas fa-coins"></i>
                        -{purchase.cost}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Purchase Confirmation Dialog */}
      <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">{selectedItem?.name || selectedItem?.title}</h4>
              <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-2">
                <i className="fas fa-coins"></i>
                {selectedItem?.cost} tokens
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Current Balance:</span>
              <span className="font-medium">{user?.tokens || 0} tokens</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">After Purchase:</span>
              <span className="font-medium">{(user?.tokens || 0) - (selectedItem?.cost || 0)} tokens</span>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setIsPurchaseDialogOpen(false);
                  setSelectedItem(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={handlePurchaseItem}
                disabled={purchaseItemMutation.isPending}
                data-testid="button-confirm-purchase"
              >
                {purchaseItemMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Purchasing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-shopping-cart mr-2"></i>
                    Confirm Purchase
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}