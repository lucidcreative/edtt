import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function Store() {
  const { user } = useAuth();

  // Get user's classrooms
  const { data: classrooms } = useQuery({
    queryKey: ["/api/classrooms"],
    enabled: !!user
  });

  const currentClassroom = classrooms?.[0];

  // Get store items
  const { data: items, isLoading } = useQuery({
    queryKey: ["/api/classrooms", currentClassroom?.id, "store"],
    enabled: !!currentClassroom
  });

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

  // Mock data if no items
  const mockItems = [
    {
      id: '1',
      name: 'Pencil Set',
      description: 'High-quality pencils for daily use',
      cost: 50,
      imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
      isActive: true,
      category: 'Supplies'
    },
    {
      id: '2',
      name: 'Extra Credit Pass',
      description: 'Skip one assignment with full credit',
      cost: 200,
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
      isActive: false,
      category: 'Rewards'
    },
    {
      id: '3',
      name: 'Homework Pass',
      description: 'Skip one homework assignment',
      cost: 150,
      imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
      isActive: true,
      category: 'Rewards'
    },
    {
      id: '4',
      name: 'Cool Stickers',
      description: 'Fun sticker pack for decorating',
      cost: 25,
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
      isActive: true,
      category: 'Supplies'
    }
  ];

  const displayItems = items?.length > 0 ? items : mockItems;

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Store</h1>
          <p className="text-gray-600">{currentClassroom.name} • {displayItems.length} items</p>
        </div>
        
        {user?.role === 'teacher' && (
          <Button data-testid="button-add-item">
            <i className="fas fa-plus mr-2"></i>
            Add Item
          </Button>
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
          {displayItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
              data-testid={`store-item-${index}`}
            >
              <div className="relative">
                <img
                  src={item.imageUrl || 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop'}
                  alt={item.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  data-testid={`item-image-${index}`}
                />
                {user?.role === 'teacher' && (
                  <div className="absolute top-4 right-4">
                    <Button
                      size="sm"
                      variant={item.isActive ? "default" : "secondary"}
                      className="rounded-full p-2 shadow-lg"
                      data-testid={`button-toggle-${index}`}
                    >
                      <i className={`fas fa-power-off ${item.isActive ? 'text-green-600' : 'text-red-600'}`}></i>
                    </Button>
                  </div>
                )}
                {!item.isActive && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      Inactive
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-2" data-testid={`item-name-${index}`}>
                  {item.name}
                </h3>
                <p className="text-gray-600 text-sm mb-3" data-testid={`item-description-${index}`}>
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-600" data-testid={`item-cost-${index}`}>
                    {item.cost} tokens
                  </span>
                  
                  {user?.role === 'teacher' ? (
                    <Button 
                      size="sm" 
                      variant="outline"
                      data-testid={`button-edit-item-${index}`}
                    >
                      Edit
                    </Button>
                  ) : (
                    <Button 
                      size="sm"
                      disabled={!item.isActive || (user?.tokens || 0) < item.cost}
                      data-testid={`button-buy-item-${index}`}
                    >
                      {(user?.tokens || 0) >= item.cost ? 'Buy' : 'Not enough tokens'}
                    </Button>
                  )}
                </div>
                
                {item.category && (
                  <Badge variant="outline" className="mt-2" data-testid={`item-category-${index}`}>
                    {item.category}
                  </Badge>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
