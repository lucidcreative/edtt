import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Edit2, Trash2, ExternalLink, Move, Eye, Star, FileText, Video, Image, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface AssignmentResource {
  id: string;
  title: string;
  description?: string;
  resourceUrl: string;
  resourceType: string;
  platform?: string;
  isRequired: boolean;
  requiredPermissions?: string;
  accessInstructions?: string;
  displayOrder: number;
  category?: string;
  isActive: boolean;
  clickCount: number;
  createdAt: string;
}

interface AssignmentResourceManagerProps {
  assignmentId: string;
  classroomId: string;
}

const RESOURCE_TYPES = [
  { value: 'google_drive', label: 'Google Drive', icon: FileText, color: 'blue' },
  { value: 'youtube', label: 'YouTube', icon: Video, color: 'red' },
  { value: 'padlet', label: 'Padlet', icon: Star, color: 'pink' },
  { value: 'website', label: 'Website', icon: LinkIcon, color: 'green' },
  { value: 'document', label: 'Document', icon: FileText, color: 'gray' },
  { value: 'image', label: 'Image', icon: Image, color: 'purple' }
];

const CATEGORIES = [
  { value: 'reference', label: 'Reference Material' },
  { value: 'template', label: 'Template' },
  { value: 'submission_guide', label: 'Submission Guide' },
  { value: 'example', label: 'Example Work' }
];

const PERMISSIONS = [
  { value: 'view', label: 'View Only' },
  { value: 'comment', label: 'View & Comment' },
  { value: 'edit', label: 'View & Edit' }
];

export function AssignmentResourceManager({ assignmentId, classroomId }: AssignmentResourceManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<AssignmentResource | null>(null);
  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    resourceUrl: '',
    resourceType: 'website',
    platform: '',
    isRequired: false,
    requiredPermissions: 'view',
    accessInstructions: '',
    category: 'reference',
    displayOrder: 0
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch assignment resources
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['/api/assignments', assignmentId, 'resources'],
    queryFn: () => apiRequest(`/api/assignments/${assignmentId}/resources`)
  });

  // Create resource mutation
  const createResourceMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/assignments/${assignmentId}/resources`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments', assignmentId, 'resources'] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: 'Resource added successfully!' });
    },
    onError: () => {
      toast({ title: 'Failed to add resource', variant: 'destructive' });
    }
  });

  // Update resource mutation
  const updateResourceMutation = useMutation({
    mutationFn: ({ resourceId, data }: { resourceId: string; data: any }) => 
      apiRequest(`/api/assignment-resources/${resourceId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments', assignmentId, 'resources'] });
      setEditingResource(null);
      resetForm();
      toast({ title: 'Resource updated successfully!' });
    },
    onError: () => {
      toast({ title: 'Failed to update resource', variant: 'destructive' });
    }
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: (resourceId: string) => 
      apiRequest(`/api/assignment-resources/${resourceId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments', assignmentId, 'resources'] });
      toast({ title: 'Resource deleted successfully!' });
    },
    onError: () => {
      toast({ title: 'Failed to delete resource', variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setResourceForm({
      title: '',
      description: '',
      resourceUrl: '',
      resourceType: 'website',
      platform: '',
      isRequired: false,
      requiredPermissions: 'view',
      accessInstructions: '',
      category: 'reference',
      displayOrder: 0
    });
  };

  const handleCreateResource = () => {
    if (!resourceForm.title || !resourceForm.resourceUrl) {
      toast({ title: 'Please fill in title and URL', variant: 'destructive' });
      return;
    }

    createResourceMutation.mutate({
      ...resourceForm,
      displayOrder: resources.length
    });
  };

  const handleUpdateResource = () => {
    if (!editingResource || !resourceForm.title || !resourceForm.resourceUrl) {
      toast({ title: 'Please fill in title and URL', variant: 'destructive' });
      return;
    }

    updateResourceMutation.mutate({
      resourceId: editingResource.id,
      data: resourceForm
    });
  };

  const handleEditResource = (resource: AssignmentResource) => {
    setEditingResource(resource);
    setResourceForm({
      title: resource.title,
      description: resource.description || '',
      resourceUrl: resource.resourceUrl,
      resourceType: resource.resourceType,
      platform: resource.platform || '',
      isRequired: resource.isRequired,
      requiredPermissions: resource.requiredPermissions || 'view',
      accessInstructions: resource.accessInstructions || '',
      category: resource.category || 'reference',
      displayOrder: resource.displayOrder
    });
  };

  const getResourceTypeConfig = (type: string) => {
    return RESOURCE_TYPES.find(rt => rt.value === type) || RESOURCE_TYPES[0];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assignment Resources</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage links and resources for this assignment
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" data-testid="button-add-resource">
              <Plus className="w-4 h-4 mr-2" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Resource</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={resourceForm.title}
                    onChange={(e) => setResourceForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Resource title"
                    data-testid="input-resource-title"
                  />
                </div>
                <div>
                  <Label htmlFor="resourceType">Resource Type *</Label>
                  <Select value={resourceForm.resourceType} onValueChange={(value) => setResourceForm(prev => ({ ...prev, resourceType: value }))}>
                    <SelectTrigger data-testid="select-resource-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="resourceUrl">URL *</Label>
                <Input
                  id="resourceUrl"
                  type="url"
                  value={resourceForm.resourceUrl}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, resourceUrl: e.target.value }))}
                  placeholder="https://..."
                  data-testid="input-resource-url"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={resourceForm.description}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this resource"
                  rows={3}
                  data-testid="textarea-resource-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={resourceForm.category} onValueChange={(value) => setResourceForm(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger data-testid="select-resource-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="permissions">Permissions</Label>
                  <Select value={resourceForm.requiredPermissions} onValueChange={(value) => setResourceForm(prev => ({ ...prev, requiredPermissions: value }))}>
                    <SelectTrigger data-testid="select-resource-permissions">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERMISSIONS.map(perm => (
                        <SelectItem key={perm.value} value={perm.value}>
                          {perm.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="accessInstructions">Access Instructions</Label>
                <Textarea
                  id="accessInstructions"
                  value={resourceForm.accessInstructions}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, accessInstructions: e.target.value }))}
                  placeholder="Any special instructions for accessing this resource"
                  rows={2}
                  data-testid="textarea-access-instructions"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRequired"
                  checked={resourceForm.isRequired}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, isRequired: e.target.checked }))}
                  className="rounded"
                  data-testid="checkbox-resource-required"
                />
                <Label htmlFor="isRequired">Mark as required resource</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleCreateResource} 
                  disabled={createResourceMutation.isPending}
                  className="flex-1"
                  data-testid="button-save-resource"
                >
                  {createResourceMutation.isPending ? 'Adding...' : 'Add Resource'}
                </Button>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resources List */}
      <div className="space-y-3">
        <AnimatePresence>
          {resources.map((resource: AssignmentResource, index: number) => {
            const typeConfig = getResourceTypeConfig(resource.resourceType);
            const Icon = typeConfig.icon;
            
            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                data-testid={`resource-card-${index}`}
              >
                <Card className="overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg bg-${typeConfig.color}-100 dark:bg-${typeConfig.color}-900/20`}>
                          <Icon className={`w-5 h-5 text-${typeConfig.color}-600 dark:text-${typeConfig.color}-400`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{resource.title}</h4>
                            {resource.isRequired && (
                              <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                Required
                              </Badge>
                            )}
                            <Badge variant="outline">{CATEGORIES.find(c => c.value === resource.category)?.label || resource.category}</Badge>
                          </div>
                          {resource.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{resource.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>{typeConfig.label}</span>
                            <span>•</span>
                            <span>{resource.clickCount} clicks</span>
                            {resource.requiredPermissions && (
                              <>
                                <span>•</span>
                                <span>{PERMISSIONS.find(p => p.value === resource.requiredPermissions)?.label}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="p-2" 
                          onClick={() => window.open(resource.resourceUrl, '_blank')}
                          data-testid={`button-open-resource-${index}`}
                        >
                          <ExternalLink className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="p-2"
                          onClick={() => handleEditResource(resource)}
                          data-testid={`button-edit-resource-${index}`}
                        >
                          <Edit2 className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="p-2"
                          onClick={() => deleteResourceMutation.mutate(resource.id)}
                          data-testid={`button-delete-resource-${index}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {resource.accessInstructions && (
                    <CardContent className="pt-0">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Access Instructions:</strong> {resource.accessInstructions}
                        </p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {resources.length === 0 && (
          <Card className="p-8 text-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LinkIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">No Resources Yet</h3>
            <p className="text-gray-600 dark:text-gray-400">Add your first resource to help students with this assignment.</p>
          </Card>
        )}
      </div>

      {/* Edit Resource Dialog */}
      <Dialog open={!!editingResource} onOpenChange={() => setEditingResource(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={resourceForm.title}
                  onChange={(e) => setResourceForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Resource title"
                  data-testid="input-edit-resource-title"
                />
              </div>
              <div>
                <Label htmlFor="edit-resourceType">Resource Type *</Label>
                <Select value={resourceForm.resourceType} onValueChange={(value) => setResourceForm(prev => ({ ...prev, resourceType: value }))}>
                  <SelectTrigger data-testid="select-edit-resource-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-resourceUrl">URL *</Label>
              <Input
                id="edit-resourceUrl"
                type="url"
                value={resourceForm.resourceUrl}
                onChange={(e) => setResourceForm(prev => ({ ...prev, resourceUrl: e.target.value }))}
                placeholder="https://..."
                data-testid="input-edit-resource-url"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={resourceForm.description}
                onChange={(e) => setResourceForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this resource"
                rows={3}
                data-testid="textarea-edit-resource-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select value={resourceForm.category} onValueChange={(value) => setResourceForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger data-testid="select-edit-resource-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-permissions">Permissions</Label>
                <Select value={resourceForm.requiredPermissions} onValueChange={(value) => setResourceForm(prev => ({ ...prev, requiredPermissions: value }))}>
                  <SelectTrigger data-testid="select-edit-resource-permissions">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERMISSIONS.map(perm => (
                      <SelectItem key={perm.value} value={perm.value}>
                        {perm.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-accessInstructions">Access Instructions</Label>
              <Textarea
                id="edit-accessInstructions"
                value={resourceForm.accessInstructions}
                onChange={(e) => setResourceForm(prev => ({ ...prev, accessInstructions: e.target.value }))}
                placeholder="Any special instructions for accessing this resource"
                rows={2}
                data-testid="textarea-edit-access-instructions"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-isRequired"
                checked={resourceForm.isRequired}
                onChange={(e) => setResourceForm(prev => ({ ...prev, isRequired: e.target.checked }))}
                className="rounded"
                data-testid="checkbox-edit-resource-required"
              />
              <Label htmlFor="edit-isRequired">Mark as required resource</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleUpdateResource} 
                disabled={updateResourceMutation.isPending}
                className="flex-1"
                data-testid="button-update-resource"
              >
                {updateResourceMutation.isPending ? 'Updating...' : 'Update Resource'}
              </Button>
              <Button variant="outline" onClick={() => setEditingResource(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}