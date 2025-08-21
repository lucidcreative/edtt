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
import { useToast } from "@/hooks/use-toast";
import { 
  Gift, 
  Users, 
  Zap, 
  Award,
  Plus,
  Star,
  Target,
  Crown,
  ChevronRight
} from "lucide-react";

interface TokenAwardInterfaceProps {
  classroomId: string;
}

interface Student {
  id: string;
  nickname: string;
  firstName: string;
  lastName: string;
  currentBalance: number;
}

interface AwardPreset {
  id: string;
  presetName: string;
  amount: number;
  category: string;
  descriptionTemplate: string;
  usageCount: number;
}

interface Category {
  id: string;
  name: string;
  colorCode: string;
  iconName: string;
  defaultAmount: number;
}

export default function TokenAwardInterface({ classroomId }: TokenAwardInterfaceProps) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [customAmount, setCustomAmount] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<AwardPreset | null>(null);
  const [awardMode, setAwardMode] = useState<'individual' | 'bulk'>('individual');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch students in classroom
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/classrooms", classroomId, "students"],
    enabled: !!classroomId
  });

  // Fetch award presets
  const { data: presets = [] } = useQuery<AwardPreset[]>({
    queryKey: ["/api/tokens/presets/classroom", classroomId],
    enabled: !!classroomId
  });

  // Fetch token categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/tokens/categories/classroom", classroomId],
    enabled: !!classroomId
  });

  // Award tokens mutation
  const awardTokensMutation = useMutation({
    mutationFn: async (data: {
      studentIds: string[];
      amount: number;
      category: string;
      description: string;
      referenceType?: string;
    }) => {
      return apiRequest("/api/tokens/award", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Tokens Awarded! 🎉",
        description: `Successfully awarded tokens to ${selectedStudents.length} student(s)`,
        variant: "default"
      });
      
      // Reset form
      setSelectedStudents([]);
      setCustomAmount("");
      setCustomDescription("");
      setSelectedPreset(null);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms", classroomId, "students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
    },
    onError: (error) => {
      toast({
        title: "Award Failed",
        description: "Failed to award tokens. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Award using preset mutation
  const awardPresetMutation = useMutation({
    mutationFn: async (data: {
      presetId: string;
      studentIds: string[];
      customDescription?: string;
    }) => {
      return apiRequest("/api/tokens/award/preset", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Tokens Awarded! 🎉",
        description: `Successfully used preset to award tokens`,
        variant: "default"
      });
      setSelectedStudents([]);
      setSelectedPreset(null);
      queryClient.invalidateQueries({ queryKey: ["/api/classrooms", classroomId] });
    }
  });

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    setSelectedStudents(
      selectedStudents.length === students.length 
        ? [] 
        : students.map(s => s.id)
    );
  };

  const handlePresetAward = (preset: AwardPreset) => {
    if (selectedStudents.length === 0) {
      toast({
        title: "Select Students",
        description: "Please select at least one student to award tokens to",
        variant: "destructive"
      });
      return;
    }

    awardPresetMutation.mutate({
      presetId: preset.id,
      studentIds: selectedStudents,
      customDescription: customDescription || undefined
    });
  };

  const handleCustomAward = () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "Select Students",
        description: "Please select at least one student to award tokens to",
        variant: "destructive"
      });
      return;
    }

    if (!customAmount || !customDescription || !selectedCategory) {
      toast({
        title: "Complete Form",
        description: "Please fill in amount, description, and category",
        variant: "destructive"
      });
      return;
    }

    awardTokensMutation.mutate({
      studentIds: selectedStudents,
      amount: parseFloat(customAmount),
      category: selectedCategory,
      description: customDescription,
      referenceType: "manual_award"
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Gift className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Award Tokens</h1>
        <p className="text-gray-600">Recognize student achievements and encourage positive behavior</p>
      </motion.div>

      {/* Student Selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Select Students</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                data-testid="button-select-all-students"
              >
                <Users className="w-4 h-4 mr-2" />
                {selectedStudents.length === students.length ? 'Clear All' : 'Select All'}
              </Button>
              <Badge variant="secondary">
                {selectedStudents.length} selected
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
            {students.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No students enrolled yet</p>
                <p className="text-sm">Students will appear here once they join your classroom</p>
              </div>
            ) : (
              students.map((student) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedStudents.includes(student.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleStudentToggle(student.id)}
                  data-testid={`student-card-${student.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {student.nickname || `${student.firstName} ${student.lastName}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        Balance: {student.currentBalance || 0} 🪙
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedStudents.includes(student.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedStudents.includes(student.id) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-white rounded-full"
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Award Methods */}
      <Tabs defaultValue="presets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="presets">
            <Zap className="w-4 h-4 mr-2" />
            Quick Presets
          </TabsTrigger>
          <TabsTrigger value="custom">
            <Plus className="w-4 h-4 mr-2" />
            Custom Award
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Award Presets</h3>
              <p className="text-sm text-gray-600">Quick ways to award common achievements</p>
            </CardHeader>
            <CardContent>
              {presets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No presets created yet</p>
                  <p className="text-sm">Create presets to quickly award common achievements</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {presets.map((preset) => (
                    <motion.div
                      key={preset.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer transition-all duration-200"
                      onClick={() => handlePresetAward(preset)}
                      data-testid={`preset-${preset.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <Star className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{preset.presetName}</div>
                            <div className="text-sm text-gray-500">{preset.category}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">+{preset.amount} 🪙</div>
                          <div className="text-xs text-gray-500">Used {preset.usageCount}x</div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        {preset.descriptionTemplate}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Custom Token Award</h3>
              <p className="text-sm text-gray-600">Create a personalized token award</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Token Amount
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter amount..."
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    data-testid="input-custom-amount"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Category
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Description
                </label>
                <Textarea
                  placeholder="Describe why these tokens are being awarded..."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  rows={3}
                  data-testid="textarea-description"
                />
              </div>

              <Button
                onClick={handleCustomAward}
                disabled={awardTokensMutation.isPending || selectedStudents.length === 0}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                data-testid="button-award-custom-tokens"
              >
                {awardTokensMutation.isPending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 mr-2"
                  >
                    <Gift className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Gift className="w-4 h-4 mr-2" />
                )}
                Award {customAmount || 0} Tokens to {selectedStudents.length} Student(s)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}