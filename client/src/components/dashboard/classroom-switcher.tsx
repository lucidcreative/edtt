import { useState } from "react";
import { useClassroom } from "@/contexts/ClassroomContext";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Plus, School } from "lucide-react";
import { motion } from "framer-motion";
import CreateClassroomModal from "@/components/classroom/create-classroom-modal";

export default function ClassroomSwitcher() {
  const { currentClassroom, classrooms, setSelectedClassroom } = useClassroom();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3"
    >
      <div className="flex items-center gap-2 text-gray-600">
        <School className="w-5 h-5" />
        <span className="text-sm font-medium">Classroom:</span>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="min-w-[200px] justify-between bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-gray-50 transition-all duration-200"
            data-testid="dropdown-classroom-switcher"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="font-medium">
                {currentClassroom?.name || "Select Classroom"}
              </span>
              {currentClassroom?.subject && (
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                  {currentClassroom.subject}
                </span>
              )}
            </div>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-64 bg-white/95 backdrop-blur-sm">
          {classrooms.length > 0 ? (
            classrooms.map((classroom: any) => (
              <DropdownMenuItem
                key={classroom.id}
                onClick={() => setSelectedClassroom(classroom)}
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                data-testid={`option-classroom-${classroom.id}`}
              >
                <div className={`w-3 h-3 rounded-full ${
                  classroom.id === currentClassroom?.id ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{classroom.name}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {classroom.subject && <span>{classroom.subject}</span>}
                    {classroom.gradeLevel && <span>• Grade {classroom.gradeLevel}</span>}
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-3 text-sm text-gray-500 text-center">
              No classrooms yet
            </div>
          )}
          
          <DropdownMenuSeparator />
          
          <CreateClassroomModal>
            <div className="p-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                data-testid="button-create-classroom-switcher"
              >
                <Plus className="w-4 h-4" />
                Create New Classroom
              </Button>
            </div>
          </CreateClassroomModal>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}