import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package, Star } from 'lucide-react';

interface StoreItem {
  id: string;
  name: string;
  description?: string;
  cost: number;
  category?: string;
  imageUrl?: string;
  inventory: number; // -1 for unlimited
  isActive: boolean;
  createdAt: string;
}

interface VirtualizedStoreProps {
  items: StoreItem[];
  userTokens?: number;
  onPurchaseItem?: (item: StoreItem) => void;
  onEditItem?: (item: StoreItem) => void;
  className?: string;
  gridMode?: boolean; // If true, use grid layout instead of list
}

export function VirtualizedStore({ 
  items, 
  userTokens = 0,
  onPurchaseItem, 
  onEditItem, 
  className,
  gridMode = false
}: VirtualizedStoreProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Sort items by cost, then by category
  const sortedItems = useMemo(() => 
    [...items].sort((a, b) => {
      if (a.category !== b.category) {
        return (a.category || '').localeCompare(b.category || '');
      }
      return a.cost - b.cost;
    }),
    [items]
  );

  const virtualizer = useVirtualizer({
    count: sortedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => gridMode ? 200 : 140, // Different heights for grid vs list
    overscan: gridMode ? 2 : 4,
  });

  const items_virtual = virtualizer.getVirtualItems();

  const canAfford = (cost: number) => userTokens >= cost;
  const isInStock = (inventory: number) => inventory === -1 || inventory > 0;

  return (
    <div 
      ref={parentRef}
      className={`h-96 overflow-auto ${className}`}
      data-testid="virtualized-store-container"
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {items_virtual.map((virtualItem) => {
          const item = sortedItems[virtualItem.index];
          const affordable = canAfford(item.cost);
          const inStock = isInStock(item.inventory);
          const canPurchase = affordable && inStock && item.isActive;
          
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <Card 
                className={`mb-3 mx-2 hover:shadow-md transition-all ${
                  !item.isActive ? 'opacity-50' : ''
                } ${!inStock ? 'border-red-200' : ''}`}
                data-testid={`store-item-${item.id}`}
              >
                <CardHeader className={`pb-2 ${gridMode ? 'text-center' : ''}`}>
                  <div className={`flex ${gridMode ? 'flex-col items-center' : 'items-start justify-between'}`}>
                    {/* Item image placeholder */}
                    {gridMode && (
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-2 flex items-center justify-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Package className="h-8 w-8 text-blue-500" />
                        )}
                      </div>
                    )}
                    
                    <div className={`${gridMode ? 'text-center' : 'flex-1 min-w-0'}`}>
                      <CardTitle className={`${gridMode ? 'text-base' : 'text-lg'} font-semibold ${gridMode ? '' : 'truncate'}`} data-testid={`item-name-${item.id}`}>
                        {item.name}
                      </CardTitle>
                      {item.description && (
                        <p className={`text-sm text-muted-foreground mt-1 ${gridMode ? 'text-center' : 'line-clamp-2'}`}>
                          {item.description}
                        </p>
                      )}
                    </div>
                    
                    {!gridMode && (
                      <div className="flex items-center space-x-2 ml-2">
                        {item.category && (
                          <Badge variant="outline" data-testid={`item-category-${item.id}`}>
                            {item.category}
                          </Badge>
                        )}
                        {!item.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        {!inStock && (
                          <Badge variant="destructive">Out of Stock</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className={`pt-0 ${gridMode ? 'text-center' : ''}`}>
                  {gridMode && (
                    <div className="flex justify-center space-x-2 mb-3">
                      {item.category && (
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      )}
                      {!inStock && (
                        <Badge variant="destructive" className="text-xs">
                          Out of Stock
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className={`flex ${gridMode ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
                    {/* Price and stock */}
                    <div className={`${gridMode ? 'text-center' : ''}`}>
                      <div className={`flex items-center ${gridMode ? 'justify-center' : ''} space-x-1`}>
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className={`font-bold ${canAfford(item.cost) ? 'text-green-600' : 'text-red-500'}`} data-testid={`item-cost-${item.id}`}>
                          {item.cost} tokens
                        </span>
                      </div>
                      {item.inventory > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.inventory} left
                        </p>
                      )}
                      {item.inventory === -1 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Unlimited
                        </p>
                      )}
                    </div>
                    
                    {/* Action buttons */}
                    <div className={`flex ${gridMode ? 'justify-center' : 'justify-end'} space-x-2`}>
                      {onPurchaseItem && (
                        <Button 
                          size="sm" 
                          disabled={!canPurchase}
                          onClick={() => onPurchaseItem(item)}
                          data-testid={`purchase-item-${item.id}`}
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          {canPurchase ? 'Purchase' : !affordable ? 'Not enough tokens' : 'Out of stock'}
                        </Button>
                      )}
                      {onEditItem && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onEditItem(item)}
                          data-testid={`edit-item-${item.id}`}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
      
      {/* Empty state */}
      {sortedItems.length === 0 && (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          <p data-testid="empty-store">No items available in the store</p>
        </div>
      )}
    </div>
  );
}