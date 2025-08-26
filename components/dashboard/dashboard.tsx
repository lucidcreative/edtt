'use client'

import { User } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Coins, Users, Trophy, BookOpen, Target, TrendingUp } from 'lucide-react'

interface DashboardProps {
  user: User
}

export function Dashboard({ user }: DashboardProps) {
  const userRole = user.user_metadata?.role || 'student'

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      return data
    }
  })

  const { data: classrooms, isLoading: classroomsLoading } = useQuery({
    queryKey: ['classrooms', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .eq(userRole === 'teacher' ? 'teacher_id' : 'id', user.id)
      
      if (error) throw error
      return data
    }
  })

  if (profileLoading) {
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
          <h1 className="text-3xl font-bold gradient-text">
            Welcome back, {profile?.first_name || profile?.nickname || user.email}!
          </h1>
          <p className="text-muted-foreground">
            {userRole === 'teacher' ? 'Manage your classroom and track student progress' : 'Earn tokens and track your learning journey'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="px-3 py-1">
            <Coins className="w-4 h-4 mr-1" />
            {profile?.token_balance || 0} tokens
          </Badge>
          <Button onClick={() => supabase.auth.signOut()}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.token_balance || 0}</div>
            <p className="text-xs text-muted-foreground">
              {profile?.total_tokens_earned || 0} earned total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {userRole === 'teacher' ? 'Students' : 'Streak'}
            </CardTitle>
            {userRole === 'teacher' ? (
              <Users className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Target className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userRole === 'teacher' ? classrooms?.length || 0 : profile?.streak_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {userRole === 'teacher' ? 'Active classrooms' : 'Days in a row'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.achievements?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Badges earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <Progress value={85} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          {userRole === 'teacher' && (
            <TabsTrigger value="manage">Manage</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest classroom activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Completed Math Assignment</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                    <Badge>+50 tokens</Badge>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Earned Perfect Attendance Badge</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                    <Badge variant="secondary">Achievement</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {userRole === 'teacher' ? (
                  <>
                    <Button className="w-full justify-start">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Create Assignment
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      Manage Students
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Analytics
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="w-full justify-start">
                      <BookOpen className="w-4 h-4 mr-2" />
                      View Assignments
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Target className="w-4 h-4 mr-2" />
                      Submit Proposal
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Coins className="w-4 h-4 mr-2" />
                      Visit Store
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
              <CardDescription>
                {userRole === 'teacher' ? 'Manage your classroom assignments' : 'Your current and completed assignments'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                No assignments available. Check back later!
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proposals">
          <Card>
            <CardHeader>
              <CardTitle>Proposals Portal</CardTitle>
              <CardDescription>
                {userRole === 'teacher' ? 'Review and manage student proposals' : 'Submit and track your project proposals'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                No proposals available. Start by creating your first proposal!
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {userRole === 'teacher' && (
          <TabsContent value="manage">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Classroom Management</CardTitle>
                  <CardDescription>Manage students and classroom settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Student Management
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Trophy className="w-4 h-4 mr-2" />
                    Badge Management
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>Configure classroom policies and rules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Target className="w-4 h-4 mr-2" />
                    Token Economy Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analytics Dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}