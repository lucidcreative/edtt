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
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export default function EconomyPage() {
  const { user } = useAuth();
  const { currentClassroom } = useClassroom();
  const [activeTab, setActiveTab] = useState("trading");
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
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Trade Offer
                  </Button>
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
          <Card>
            <CardHeader>
              <CardTitle>Marketplace</CardTitle>
              <CardDescription>
                Buy and sell items with your classmates using tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Marketplace Coming Soon</h3>
                <p className="text-muted-foreground mb-4">
                  Trade your items with classmates for tokens in a secure marketplace environment
                </p>
                <Button disabled>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Browse Listings
                </Button>
              </div>
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
    </div>
  );
}