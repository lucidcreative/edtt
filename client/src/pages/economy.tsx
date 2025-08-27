import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useClassroom } from "@/contexts/ClassroomContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeftRight, 
  ShoppingCart, 
  Users, 
  Plus,
  TrendingUp,
  Package,
  ExternalLink,
  Search,
  Filter,
  Heart,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TradeOffer = {
  id: string;
  title: string;
  description: string;
  offeringStudentId: string;
  wantedStoreItemId?: string;
  status: 'open' | 'pending' | 'completed' | 'cancelled';
  createdAt: string;
};

type GroupBuy = {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  status: 'active' | 'completed' | 'expired';
  createdBy: string;
  createdAt: string;
  deadline: string;
};

type InventoryItem = {
  id: string;
  storeItemId: string;
  status: 'owned' | 'trading' | 'listed';
  condition: 'new' | 'good' | 'fair';
  acquiredAt: string;
  storeItem?: {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
  };
};

type MarketplaceListing = {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
  status: 'active' | 'sold' | 'inactive';
  images: string[];
  seller: {
    id: string;
    student: {
      id: string;
      nickname: string;
    };
  };
  createdAt: string;
};

export default function EconomyPage() {
  const { user } = useAuth();
  const { currentClassroom } = useClassroom();
  const [activeTab, setActiveTab] = useState("trading");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Trade offer modal states
  const [isTradeOfferModalOpen, setIsTradeOfferModalOpen] = useState(false);
  const [tradeOfferForm, setTradeOfferForm] = useState({
    title: '',
    description: '',
    wantedItem: ''
  });
  
  // Trade response modal states
  const [isTradeResponseModalOpen, setIsTradeResponseModalOpen] = useState(false);
  const [selectedTradeOffer, setSelectedTradeOffer] = useState<TradeOffer | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch student inventory
  const { data: inventory = [], isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory', user?.id, currentClassroom?.id],
    enabled: !!user?.id && !!currentClassroom?.id,
  });

  // Fetch trade offers for classroom
  const { data: tradeOffers = [], isLoading: tradesLoading } = useQuery<TradeOffer[]>({
    queryKey: ['/api/trades/classroom', currentClassroom?.id],
    enabled: !!currentClassroom?.id,
  });

  // Fetch my trade offers
  const { data: myTradeOffers = [], isLoading: myTradesLoading } = useQuery<TradeOffer[]>({
    queryKey: ['/api/trades/my-offers'],
    enabled: !!user?.id,
  });

  // Fetch group buys for classroom
  const { data: groupBuys = [], isLoading: groupBuysLoading } = useQuery<GroupBuy[]>({
    queryKey: ['/api/group-buys/classroom', currentClassroom?.id],
    enabled: !!currentClassroom?.id,
  });

  // Fetch marketplace listings
  const { data: marketplaceListings = [], isLoading: marketplaceLoading } = useQuery<MarketplaceListing[]>({
    queryKey: ['/api/marketplace/listings/classroom', currentClassroom?.id],
    enabled: !!currentClassroom?.id,
  });

  // Filter listings based on search and category
  const filteredListings = marketplaceListings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || listing.category === selectedCategory;
    return matchesSearch && matchesCategory && listing.status === "active";
  });

  // Handle trade offer creation
  const handleCreateTradeOffer = () => {
    if (!tradeOfferForm.title.trim() || !tradeOfferForm.description.trim()) {
      toast({ 
        title: "Missing Information", 
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    // Here we would normally call an API to create the trade offer
    toast({ 
      title: "Trade Offer Created!", 
      description: `Your trade offer "${tradeOfferForm.title}" has been posted.`
    });
    
    // Reset form and close modal
    setTradeOfferForm({ title: '', description: '', wantedItem: '' });
    setIsTradeOfferModalOpen(false);
  };

  // Handle trade response
  const handleTradeResponse = (offer: TradeOffer, action: 'accept' | 'decline' | 'counter') => {
    setSelectedTradeOffer(offer);
    setIsTradeResponseModalOpen(true);
  };

  // Submit trade response
  const submitTradeResponse = (action: 'accept' | 'decline' | 'counter') => {
    if (!selectedTradeOffer) return;
    
    toast({ 
      title: `Trade ${action === 'accept' ? 'Accepted' : action === 'decline' ? 'Declined' : 'Counter Offer Sent'}!", 
      description: `You have ${action}d the trade offer from ${selectedTradeOffer.id}.`
    });
    
    setIsTradeResponseModalOpen(false);
    setSelectedTradeOffer(null);
    setResponseMessage('');
  };

  // Group buy functionality
  const handleContributeToGroupBuy = (groupBuy: GroupBuy) => {
    toast({ 
      title: "Contribution Sent!", 
      description: `You have contributed to "${groupBuy.title}". Contribution functionality coming soon!`
    });
  };

  const handleViewGroupBuyDetails = (groupBuy: GroupBuy) => {
    toast({ 
      title: "Group Buy Details", 
      description: `Viewing details for "${groupBuy.title}". Details modal coming soon!`
    });
  };

  // Handle trade initiation
  const handleInitiateTrade = (item: InventoryItem) => {
    toast({
      title: "Trade Feature",
      description: "Trade creation modal will be implemented next. Item: " + (item.storeItem?.name || 'Unknown'),
    });
  };

  // Handle trade response
  const handleRespondToTrade = (offer: TradeOffer) => {
    toast({
      title: "Trade Response",
      description: "Trade response modal will be implemented next. Offer: " + offer.title,
    });
  };

  // Handle group buy contribution
  const handleContributeToGroupBuy = (groupBuy: GroupBuy) => {
    toast({
      title: "Contribute to Group Buy",
      description: "Contribution modal will be implemented next. Goal: " + groupBuy.title,
    });
  };

  // Handle view group buy details
  const handleViewGroupBuyDetails = (groupBuy: GroupBuy) => {
    toast({
      title: "Group Buy Details",
      description: "Details modal will be implemented next. " + groupBuy.title,
    });
  };

  if (!currentClassroom) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please select a classroom to access the Economy features.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Economy & Marketplace</h1>
        <p className="text-muted-foreground mt-2">
          Trade items, collaborate on group purchases, and participate in the classroom economy
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trading" className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Trading
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="group-buys" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Group Buys
          </TabsTrigger>
        </TabsList>

        {/* Trading Tab */}
        <TabsContent value="trading" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* My Inventory */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  My Inventory
                </CardTitle>
                <CardDescription>
                  Items you own that can be traded with classmates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {inventoryLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : inventory.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No items in your inventory yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Purchase items from the store to start trading!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inventory.slice(0, 3).map((item: InventoryItem) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium">{item.storeItem?.name || 'Unknown Item'}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant={item.status === 'owned' ? 'default' : 'secondary'}>
                                {item.status}
                              </Badge>
                              <Badge variant="outline">{item.condition}</Badge>
                            </div>
                          </div>
                        </div>
                        {item.status === 'owned' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleInitiateTrade(item)}
                            data-testid={`button-trade-${item.id}`}
                            aria-label={`Trade ${item.storeItem?.name || 'item'}`}
                          >
                            Trade
                          </Button>
                        )}
                      </div>
                    ))}
                    {inventory.length > 3 && (
                      <Button variant="ghost" className="w-full">
                        View All ({inventory.length} items)
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Trades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Available Trades
                </CardTitle>
                <CardDescription>
                  Browse trade offers from your classmates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tradesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : tradeOffers.length === 0 ? (
                  <div className="text-center py-8">
                    <ArrowLeftRight className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No active trades available</p>
                    <p className="text-sm text-muted-foreground mt-1">Be the first to create a trade offer!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tradeOffers.slice(0, 3).map((offer: TradeOffer) => (
                      <div key={offer.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{offer.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{offer.description}</p>
                            <Badge className="mt-2" variant={offer.status === 'open' ? 'default' : 'secondary'}>
                              {offer.status}
                            </Badge>
                          </div>
                          {offer.status === 'open' && offer.offeringStudentId !== user?.id && (
                            <Button 
                              size="sm"
                              onClick={() => handleRespondToTrade(offer)}
                              data-testid={`button-respond-trade-${offer.id}`}
                              aria-label={`Respond to trade offer: ${offer.title}`}
                            >
                              Respond
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button variant="ghost" className="w-full">
                      View All Trades
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* My Trade Offers */}
          <Card>
            <CardHeader>
              <CardTitle>My Trade Offers</CardTitle>
              <CardDescription>
                Track your active trade offers and responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myTradesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : myTradeOffers.length === 0 ? (
                <div className="text-center py-8">
                  <ArrowLeftRight className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">You haven't created any trade offers yet</p>
                  <Dialog open={isTradeOfferModalOpen} onOpenChange={setIsTradeOfferModalOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-create-trade-offer" className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Trade Offer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-black dark:text-white">Create Trade Offer</DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-300">
                          Create a new trade offer to exchange items with your classmates.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label htmlFor="trade-title" className="text-black dark:text-white">Trade Title *</Label>
                          <Input
                            data-testid="input-trade-title"
                            id="trade-title"
                            placeholder="What are you offering?"
                            value={tradeOfferForm.title}
                            onChange={(e) => setTradeOfferForm(prev => ({ ...prev, title: e.target.value }))}
                            className="mt-1 bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600"
                          />
                        </div>
                        <div>
                          <Label htmlFor="trade-description" className="text-black dark:text-white">Description *</Label>
                          <Textarea
                            data-testid="textarea-trade-description"
                            id="trade-description"
                            placeholder="Describe what you're offering and what you want in return..."
                            value={tradeOfferForm.description}
                            onChange={(e) => setTradeOfferForm(prev => ({ ...prev, description: e.target.value }))}
                            className="mt-1 bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="wanted-item" className="text-black dark:text-white">Wanted Item (Optional)</Label>
                          <Input
                            data-testid="input-wanted-item"
                            id="wanted-item"
                            placeholder="Specific item you're looking for..."
                            value={tradeOfferForm.wantedItem}
                            onChange={(e) => setTradeOfferForm(prev => ({ ...prev, wantedItem: e.target.value }))}
                            className="mt-1 bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600"
                          />
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                          <Button 
                            data-testid="button-cancel-trade"
                            variant="outline" 
                            onClick={() => {
                              setTradeOfferForm({ title: '', description: '', wantedItem: '' });
                              setIsTradeOfferModalOpen(false);
                            }}
                            className="text-black dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Cancel
                          </Button>
                          <Button data-testid="button-submit-trade" onClick={handleCreateTradeOffer}>
                            Create Trade Offer
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {myTradeOffers.map((offer: TradeOffer) => (
                    <div key={offer.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium">{offer.title}</h4>
                        <Badge variant={offer.status === 'open' ? 'default' : 'secondary'}>
                          {offer.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{offer.description}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        {offer.status === 'open' && (
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace" className="space-y-6">
          {/* Search and Filter Bar */}
          <Card>
            <CardHeader>
              <CardTitle>Marketplace</CardTitle>
              <CardDescription>
                Buy and sell items with your classmates using tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    data-testid="input-marketplace-search"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger data-testid="select-category" className="w-full sm:w-48 bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="school-supplies">School Supplies</SelectItem>
                    <SelectItem value="books">Books</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  data-testid="button-create-listing"
                  variant="outline"
                  className="text-white dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => toast({ title: "Create Listing", description: "Listing creation feature coming soon!" })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Listing
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Marketplace Listings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-white dark:text-white">
                Available Items ({filteredListings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {marketplaceLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="bg-card dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-4">
                        <div className="animate-pulse space-y-3">
                          <div className="bg-gray-300 dark:bg-gray-600 h-32 rounded" />
                          <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded w-3/4" />
                          <div className="bg-gray-300 dark:bg-gray-600 h-3 rounded w-1/2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2 text-white dark:text-white">No items found</h3>
                  <p className="text-muted-foreground dark:text-gray-300">
                    {searchQuery || selectedCategory !== "all" ? "Try adjusting your search or filters." : "No items are currently listed for sale."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredListings.map((listing) => (
                    <Card key={listing.id} className="bg-card dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        {/* Listing Image Placeholder */}
                        <div className="bg-gray-200 dark:bg-gray-600 h-32 rounded mb-3 flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                        
                        {/* Listing Title */}
                        <h4 className="font-medium text-black dark:text-white mb-2 line-clamp-1">
                          {listing.title}
                        </h4>
                        
                        {/* Listing Description */}
                        <p className="text-sm text-muted-foreground dark:text-gray-300 mb-3 line-clamp-2">
                          {listing.description}
                        </p>
                        
                        {/* Price and Seller */}
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                            {listing.price} tokens
                          </span>
                          <span className="text-xs text-muted-foreground dark:text-gray-400">
                            by {listing.seller?.student?.nickname || 'Anonymous'}
                          </span>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            data-testid={`button-buy-${listing.id}`}
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => toast({ title: "Purchase Item", description: "Purchase functionality coming soon!" })}
                          >
                            <ShoppingCart className="w-4 h-4 mr-1" />
                            Buy
                          </Button>
                          <Button
                            data-testid={`button-wishlist-${listing.id}`}
                            variant="outline"
                            size="sm"
                            className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => toast({ title: "Added to Wishlist", description: "Wishlist functionality coming soon!" })}
                          >
                            <Heart className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {/* Listing Category Tag */}
                        <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <span className="inline-block bg-gray-100 dark:bg-gray-700 text-xs px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                            {listing.category}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Group Buys Tab */}
        <TabsContent value="group-buys" className="space-y-6">
          <div className="grid gap-6">
            {/* Active Group Buys */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Active Group Buys
                </CardTitle>
                <CardDescription>
                  Collaborate with classmates to purchase rewards together
                </CardDescription>
              </CardHeader>
              <CardContent>
                {groupBuysLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : groupBuys.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No active group buys in your classroom</p>
                    {user?.role === 'teacher' ? (
                      <Button className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Start Group Buy
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-2">
                        Ask your teacher to start a group buy!
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {groupBuys.map((groupBuy: GroupBuy) => (
                      <div key={groupBuy.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium">{groupBuy.title}</h4>
                          <Badge variant={groupBuy.status === 'active' ? 'default' : 'secondary'}>
                            {groupBuy.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{groupBuy.description}</p>
                        
                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{groupBuy.currentAmount} tokens</span>
                            <span>{groupBuy.targetAmount} tokens</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(groupBuy.progress, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {groupBuy.progress}% funded
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleContributeToGroupBuy(groupBuy)}
                            data-testid={`button-contribute-${groupBuy.id}`}
                            aria-label={`Contribute to ${groupBuy.title}`}
                          >
                            Contribute
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewGroupBuyDetails(groupBuy)}
                            data-testid={`button-details-${groupBuy.id}`}
                            aria-label={`View details for ${groupBuy.title}`}
                          >
                            Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Trade Response Modal */}
      <Dialog open={isTradeResponseModalOpen} onOpenChange={setIsTradeResponseModalOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white">Respond to Trade Offer</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              {selectedTradeOffer && `Responding to "${selectedTradeOffer.title}"`}
            </DialogDescription>
          </DialogHeader>
          {selectedTradeOffer && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-black dark:text-white mb-2">{selectedTradeOffer.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{selectedTradeOffer.description}</p>
                <p className="text-xs text-muted-foreground">Posted by Student #{selectedTradeOffer.offeringStudentId.slice(-6)}</p>
              </div>
              
              <div>
                <Label htmlFor="response-message" className="text-black dark:text-white">Response Message (Optional)</Label>
                <Textarea
                  data-testid="textarea-response-message"
                  id="response-message"
                  placeholder="Add a message with your response..."
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  className="mt-1 bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button 
                  data-testid="button-decline-trade"
                  variant="outline"
                  onClick={() => submitTradeResponse('decline')}
                  className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Decline
                </Button>
                <Button 
                  data-testid="button-counter-offer"
                  variant="outline"
                  onClick={() => submitTradeResponse('counter')}
                  className="text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                >
                  Counter Offer
                </Button>
                <Button 
                  data-testid="button-accept-trade"
                  onClick={() => submitTradeResponse('accept')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Accept Trade
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}