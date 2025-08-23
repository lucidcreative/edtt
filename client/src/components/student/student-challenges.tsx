import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'individual' | 'group';
  targetValue: number;
  tokenReward: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  progress?: number;
  isCompleted?: boolean;
}

export default function StudentChallenges() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed'>('active');

  // Get student's challenges
  const { data: challenges = [], isLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/students", user?.id, "challenges"],
    enabled: !!user?.id && user?.role === 'student'
  });

  // Join challenge mutation
  const joinChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const response = await apiRequest('POST', `/api/challenges/${challengeId}/join`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Challenge Joined", description: "You've successfully joined the challenge! Good luck!" });
      queryClient.invalidateQueries({ queryKey: ["/api/students", user?.id, "challenges"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to join challenge. Please try again.", variant: "destructive" });
    }
  });

  const activeChallenges = challenges.filter(c => c.isActive && !c.isCompleted);
  const completedChallenges = challenges.filter(c => c.isCompleted);

  const getProgressPercentage = (progress: number = 0, target: number) => {
    return Math.min((progress / target) * 100, 100);
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'individual':
        return "fas fa-user text-blue-500";
      case 'group':
        return "fas fa-users text-purple-500";
      default:
        return "fas fa-trophy text-yellow-500";
    }
  };

  const getStatusBadge = (challenge: Challenge) => {
    if (challenge.isCompleted) {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    }
    if (challenge.isActive) {
      return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
    }
    return <Badge variant="outline">Upcoming</Badge>;
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-800">Challenges</h1>
        <p className="text-gray-600 mt-1">Take on exciting challenges and earn bonus tokens!</p>
      </motion.div>

      {/* Challenge Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold mb-1">{activeChallenges.length}</div>
                <div className="text-sm opacity-90">Active Challenges</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">{completedChallenges.length}</div>
                <div className="text-sm opacity-90">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex gap-2"
      >
        <Button
          variant={selectedTab === 'active' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('active')}
          data-testid="tab-active-challenges"
        >
          <i className="fas fa-play mr-2"></i>
          Active Challenges ({activeChallenges.length})
        </Button>
        <Button
          variant={selectedTab === 'completed' ? 'default' : 'outline'}
          onClick={() => setSelectedTab('completed')}
          data-testid="tab-completed-challenges"
        >
          <i className="fas fa-check mr-2"></i>
          Completed ({completedChallenges.length})
        </Button>
      </motion.div>

      {/* Challenges Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {selectedTab === 'active' ? (
          activeChallenges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeChallenges.map((challenge, index) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <i className={getChallengeIcon(challenge.type)}></i>
                            {challenge.title}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(challenge)}
                            <Badge variant="outline">
                              <i className="fas fa-coins mr-1 text-yellow-500"></i>
                              {challenge.tokenReward} tokens
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">{challenge.description}</p>
                        
                        {challenge.progress !== undefined && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Progress</span>
                              <span className="font-medium">
                                {challenge.progress}/{challenge.targetValue}
                              </span>
                            </div>
                            <Progress 
                              value={getProgressPercentage(challenge.progress, challenge.targetValue)} 
                              className="h-2"
                            />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Ends: {new Date(challenge.endDate).toLocaleDateString()}</span>
                          <span className="capitalize">{challenge.type} Challenge</span>
                        </div>
                        
                        <Button 
                          className="w-full"
                          disabled={challenge.progress !== undefined || joinChallengeMutation.isPending}
                          onClick={() => joinChallengeMutation.mutate(challenge.id)}
                          data-testid={`button-join-${challenge.id}`}
                        >
                          {challenge.progress !== undefined ? (
                            <>
                              <i className="fas fa-check mr-2"></i>
                              Participating
                            </>
                          ) : joinChallengeMutation.isPending ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              Joining...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-plus mr-2"></i>
                              Join Challenge
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-trophy text-3xl text-white"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Active Challenges</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                No challenges are currently available. Check back soon for new opportunities to earn extra tokens!
              </p>
            </div>
          )
        ) : (
          completedChallenges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedChallenges.map((challenge, index) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-all duration-200 border-2 border-green-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <i className="fas fa-check-circle text-green-500"></i>
                            {challenge.title}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(challenge)}
                            <Badge className="bg-green-100 text-green-800">
                              <i className="fas fa-coins mr-1 text-yellow-500"></i>
                              +{challenge.tokenReward} tokens
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">{challenge.description}</p>
                        
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-center gap-2 text-green-800">
                            <i className="fas fa-trophy"></i>
                            <span className="font-medium">Challenge Completed!</span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 text-center">
                          Completed {challenge.type} challenge
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-trophy text-3xl text-white"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Completed Challenges</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Complete your first challenge to see your achievements here!
              </p>
            </div>
          )
        )}
      </motion.div>
    </div>
  );
}