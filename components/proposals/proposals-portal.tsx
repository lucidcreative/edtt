'use client'

import { User } from '@supabase/supabase-js'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { Plus, FileText, Clock, CheckCircle, XCircle, DollarSign, Users } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface ProposalsPortalProps {
  user: User
}

export function ProposalsPortal({ user }: ProposalsPortalProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const userRole = user.user_metadata?.role || 'student'
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: proposals, isLoading } = useQuery({
    queryKey: ['proposals', user.id],
    queryFn: async () => {
      const query = supabase
        .from('proposals')
        .select(`
          *,
          assignment:assignments(*),
          student:users!proposals_student_id_fkey(*)
        `)

      if (userRole === 'student') {
        query.eq('student_id', user.id)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    }
  })

  const { data: assignments } = useQuery({
    queryKey: ['assignments', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('type', 'proposal')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: userRole === 'student'
  })

  const createProposal = useMutation({
    mutationFn: async (proposalData: any) => {
      const { data, error } = await supabase
        .from('proposals')
        .insert({
          ...proposalData,
          student_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      setIsCreateDialogOpen(false)
      toast({
        title: 'Proposal submitted!',
        description: 'Your proposal has been submitted for review.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const updateProposal = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('proposals')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      toast({
        title: 'Proposal updated!',
        description: 'The proposal has been updated successfully.',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    createProposal.mutate({
      assignment_id: formData.get('assignment_id'),
      title: formData.get('title'),
      content: formData.get('content'),
      priority: formData.get('priority'),
      project_budget: parseInt(formData.get('project_budget') as string) || 0,
      status: 'draft',
      progress_percentage: 0,
    })
  }

  const handleSelectWinner = async (proposalId: string) => {
    updateProposal.mutate({
      id: proposalId,
      updates: {
        is_winner: true,
        selected_at: new Date().toISOString(),
        selected_by: user.id,
        status: 'approved',
      },
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500'
      case 'submitted': return 'bg-blue-500'
      case 'approved': return 'bg-green-500'
      case 'rejected': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />
      case 'submitted': return <Clock className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Proposals Portal</h1>
          <p className="text-muted-foreground">
            {userRole === 'teacher' 
              ? 'Review and manage student project proposals' 
              : 'Submit and track your project proposals'}
          </p>
        </div>
        {userRole === 'student' && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Proposal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Proposal</DialogTitle>
                <DialogDescription>
                  Submit a new project proposal for review.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="assignment_id">Assignment</Label>
                  <Select name="assignment_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an assignment" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignments?.map((assignment) => (
                        <SelectItem key={assignment.id} value={assignment.id}>
                          {assignment.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Project Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Enter your project title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Project Description</Label>
                  <Textarea
                    id="content"
                    name="content"
                    placeholder="Describe your project in detail..."
                    className="min-h-32"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select name="priority" defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project_budget">Project Budget (tokens)</Label>
                    <Input
                      id="project_budget"
                      name="project_budget"
                      type="number"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createProposal.isPending}>
                    {createProposal.isPending ? 'Submitting...' : 'Submit Proposal'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Proposals List */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Proposals</TabsTrigger>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="winners">Winners</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid gap-6">
            {proposals?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No proposals yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {userRole === 'student' 
                      ? "You haven't submitted any proposals yet." 
                      : "No student proposals have been submitted yet."}
                  </p>
                  {userRole === 'student' && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Proposal
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              proposals.map((proposal) => (
                <Card key={proposal.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${getStatusColor(proposal.status)} text-white`}>
                          {getStatusIcon(proposal.status)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{proposal.title || 'Untitled Proposal'}</CardTitle>
                          <CardDescription>
                            {userRole === 'teacher' && proposal.student && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {proposal.student.first_name} {proposal.student.last_name}
                              </span>
                            )}
                            Submitted {formatDate(proposal.created_at)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={`${getStatusColor(proposal.status)} text-white border-none`}>
                          {proposal.status}
                        </Badge>
                        {proposal.is_winner && (
                          <Badge className="bg-yellow-500 text-black">
                            Winner
                          </Badge>
                        )}
                        {proposal.priority && (
                          <Badge variant="secondary">
                            {proposal.priority} priority
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {proposal.content}
                    </p>
                    
                    {proposal.project_budget && (
                      <div className="flex items-center gap-2 mb-4">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Budget: {proposal.project_budget} tokens</span>
                      </div>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{proposal.progress_percentage}%</span>
                      </div>
                      <Progress value={proposal.progress_percentage} />
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-xs text-muted-foreground">
                        Assignment: {proposal.assignment?.title}
                      </div>
                      
                      {userRole === 'teacher' && proposal.status === 'submitted' && !proposal.is_winner && (
                        <Button 
                          size="sm" 
                          onClick={() => handleSelectWinner(proposal.id)}
                          disabled={updateProposal.isPending}
                        >
                          Select Winner
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="grid gap-6">
            {proposals?.filter(p => p.status === 'submitted').map((proposal) => (
              <Card key={proposal.id}>
                <CardContent className="p-6">
                  <p>Pending proposals will be displayed here...</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="approved">
          <div className="grid gap-6">
            {proposals?.filter(p => p.status === 'approved').map((proposal) => (
              <Card key={proposal.id}>
                <CardContent className="p-6">
                  <p>Approved proposals will be displayed here...</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="winners">
          <div className="grid gap-6">
            {proposals?.filter(p => p.is_winner).map((proposal) => (
              <Card key={proposal.id}>
                <CardContent className="p-6">
                  <p>Winning proposals will be displayed here...</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}