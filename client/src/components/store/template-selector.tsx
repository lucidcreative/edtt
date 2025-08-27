import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { Search, Package, Plus, Edit3 } from "lucide-react";

interface StoreTemplate {
  id: string;
  title: string;
  description: string;
  suggestedPrice: number;
  category: string;
  itemType: string;
  icon: string;
  tags: string[];
}

interface TemplateSelectorProps {
  templates: StoreTemplate[];
  onSubmit: (data: any) => void;
  isLoading: boolean;
  classroomId: string;
}

export default function TemplateSelector({ templates, onSubmit, isLoading, classroomId }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<StoreTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("templates");
  
  // Custom item form data
  const [customItem, setCustomItem] = useState({
    title: "",
    description: "",
    basePrice: 0,
    category: "",
    itemType: "physical",
    icon: "📦",
    inventoryType: "unlimited",
    totalQuantity: undefined,
    maxPerStudent: 1
  });

  // Filter templates
  const categories = ["all", ...Array.from(new Set(templates.map(t => t.category).filter(Boolean)))];
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTemplateSelect = (template: StoreTemplate) => {
    setSelectedTemplate(template);
  };

  const handleTemplateSubmit = () => {
    if (!selectedTemplate) return;
    
    onSubmit({
      classroomId,
      title: selectedTemplate.title,
      description: selectedTemplate.description,
      basePrice: selectedTemplate.suggestedPrice,
      currentPrice: selectedTemplate.suggestedPrice,
      itemType: selectedTemplate.itemType,
      category: selectedTemplate.category,
      icon: selectedTemplate.icon,
      inventoryType: "unlimited",
      maxPerStudent: 1,
      tags: selectedTemplate.tags
    });
  };

  const handleCustomSubmit = () => {
    onSubmit({
      classroomId,
      ...customItem,
      currentPrice: customItem.basePrice
    });
  };

  const commonIcons = [
    '📦', '📚', '✏️', '🎮', '🎵', '🎤', '⭐', '🏆', '👑', '🎯',
    '💻', '📱', '🔖', '📝', '🎨', '🧸', '🍎', '🏀', '⚽', '🎭',
    '🔬', '🧮', '📐', '🗺️', '🎲', '🃏', '🎪', '🎡', '🎢', '🎠'
  ];

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Use Template
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Create Custom
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="pl-10"
                data-testid="input-search-templates"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger data-testid="select-template-category">
                <SelectValue placeholder="Filter by category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Grid */}
          <ScrollArea className="h-96">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedTemplate?.id === template.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                    data-testid={`template-${template.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{template.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-gray-900 mb-1">
                            {template.title}
                          </h3>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {template.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs">
                              {template.category}
                            </Badge>
                            <span className="font-bold text-green-600 text-sm">
                              {template.suggestedPrice} 🪙
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollArea>

          {/* Selected Template Preview */}
          {selectedTemplate && (
            <Card className="border-blue-500 bg-blue-50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedTemplate.icon}</span>
                  <div>
                    <h3 className="font-bold text-lg">{selectedTemplate.title}</h3>
                    <p className="text-gray-600">{selectedTemplate.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge>{selectedTemplate.category}</Badge>
                    <Badge variant="outline" className="capitalize">
                      {selectedTemplate.itemType.replace('_', ' ')}
                    </Badge>
                  </div>
                  <span className="font-bold text-xl text-green-600">
                    {selectedTemplate.suggestedPrice} 🪙
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Template Button */}
          <Button
            onClick={handleTemplateSubmit}
            disabled={!selectedTemplate || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
            data-testid="button-add-template"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 mr-2"
              >
                <Plus className="w-4 h-4" />
              </motion.div>
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add to Store
          </Button>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          {/* Custom Item Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Item Title *
                </label>
                <Input
                  value={customItem.title}
                  onChange={(e) => setCustomItem(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter item title..."
                  required
                  data-testid="input-custom-title"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Description *
                </label>
                <Textarea
                  value={customItem.description}
                  onChange={(e) => setCustomItem(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what students will receive..."
                  rows={3}
                  required
                  data-testid="textarea-custom-description"
                />
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Choose Icon
              </label>
              <div className="grid grid-cols-10 gap-2 p-4 border rounded-lg bg-gray-50 max-h-32 overflow-y-auto">
                {commonIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setCustomItem(prev => ({ ...prev, icon }))}
                    className={`text-2xl p-2 rounded hover:bg-gray-200 transition-colors ${
                      customItem.icon === icon ? 'bg-blue-200 ring-2 ring-blue-500' : ''
                    }`}
                    data-testid={`icon-${icon}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-center">
                <span className="text-sm text-gray-600">Selected: </span>
                <span className="text-2xl">{customItem.icon}</span>
              </div>
            </div>

            {/* Pricing and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Price (Tokens) *
                </label>
                <Input
                  type="number"
                  value={customItem.basePrice}
                  onChange={(e) => setCustomItem(prev => ({ ...prev, basePrice: Number(e.target.value) }))}
                  min="1"
                  required
                  data-testid="input-custom-price"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Category *
                </label>
                <Input
                  value={customItem.category}
                  onChange={(e) => setCustomItem(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Rewards, Supplies"
                  required
                  data-testid="input-custom-category"
                />
              </div>
            </div>

            {/* Item Type */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Item Type *
              </label>
              <Select value={customItem.itemType} onValueChange={(value: any) => setCustomItem(prev => ({ ...prev, itemType: value }))}>
                <SelectTrigger data-testid="select-custom-type">
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

            {/* Add Custom Item Button */}
            <Button
              onClick={handleCustomSubmit}
              disabled={!customItem.title || !customItem.description || !customItem.category || isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
              data-testid="button-add-custom"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 mr-2"
                >
                  <Plus className="w-4 h-4" />
                </motion.div>
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Add Custom Item
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}