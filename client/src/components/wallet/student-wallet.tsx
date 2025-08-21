import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Wallet, 
  TrendingUp, 
  History, 
  Trophy,
  Star,
  Gift,
  Target,
  ChevronRight,
  Coins
} from "lucide-react";

interface StudentWalletProps {
  studentId: string;
  classroomId: string;
}

interface Transaction {
  id: string;
  amount: number;
  transactionType: 'earned' | 'spent' | 'awarded' | 'bonus' | 'penalty';
  category: string;
  description: string;
  transactionDate: string;
  balanceAfter: number;
}

interface WalletData {
  currentBalance: number;
  totalEarned: number;
  totalSpent: number;
  transactions: Transaction[];
}

export default function StudentWallet({ studentId, classroomId }: StudentWalletProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Fetch wallet data
  const { data: walletData, isLoading } = useQuery<WalletData>({
    queryKey: ["/api/wallets/student", studentId, "classroom", classroomId],
    enabled: !!studentId && !!classroomId
  });

  // Fetch recent milestones
  const { data: milestones = [] } = useQuery({
    queryKey: ["/api/milestones/student", studentId, "classroom", classroomId],
    enabled: !!studentId && !!classroomId
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8"
        >
          <Coins className="w-8 h-8 text-blue-500" />
        </motion.div>
      </div>
    );
  }

  const currentBalance = walletData?.currentBalance || 0;
  const totalEarned = walletData?.totalEarned || 0;
  const totalSpent = walletData?.totalSpent || 0;
  const transactions = walletData?.transactions || [];

  return (
    <div className="max-w-md mx-auto bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      {/* Header with Balance */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-b-3xl shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6" />
            <h1 className="text-lg font-bold">My Wallet</h1>
          </div>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
            <History className="w-4 h-4" />
          </Button>
        </div>

        {/* Balance Display */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <div className="text-sm opacity-90 mb-1">Current Balance</div>
          <motion.div
            key={currentBalance}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="text-4xl font-bold mb-4"
            data-testid="balance-display"
          >
            {currentBalance.toLocaleString()} <span className="text-2xl">🪙</span>
          </motion.div>
          
          {/* Quick Stats */}
          <div className="flex justify-between text-sm opacity-90">
            <div className="text-center">
              <div className="font-medium">{totalEarned.toLocaleString()}</div>
              <div>Total Earned</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{totalSpent.toLocaleString()}</div>
              <div>Total Spent</div>
            </div>
          </div>
        </motion.div>

        {/* Achievement Celebration */}
        {milestones.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 p-3 bg-white/20 rounded-2xl backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="w-4 h-4 text-yellow-300" />
              <span>Recent milestone achieved!</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Content Tabs */}
      <div className="p-4">
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="transactions" className="text-sm">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-sm">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-3">
            <ScrollArea className="h-96">
              {transactions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-gray-500"
                >
                  <Coins className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Start earning tokens by completing assignments!</p>
                </motion.div>
              ) : (
                <AnimatePresence>
                  {transactions.map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3 cursor-pointer hover:shadow-md transition-all duration-200"
                      onClick={() => setSelectedTransaction(transaction)}
                      data-testid={`transaction-${transaction.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.amount > 0 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {transaction.transactionType === 'earned' && <Star className="w-5 h-5" />}
                            {transaction.transactionType === 'awarded' && <Gift className="w-5 h-5" />}
                            {transaction.transactionType === 'bonus' && <Trophy className="w-5 h-5" />}
                            {transaction.transactionType === 'spent' && <Target className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">
                              {transaction.description}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Badge variant="secondary" className="text-xs py-0 px-2">
                                {transaction.category}
                              </Badge>
                              <span>{new Date(transaction.transactionDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold text-sm ${
                            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold text-sm">Earning Breakdown</h3>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-gray-500 py-4 text-sm">
                    No data to analyze yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Category breakdown would go here */}
                    <div className="text-center text-gray-500 py-4 text-sm">
                      Analytics coming soon...
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setSelectedTransaction(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
              
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  selectedTransaction.amount > 0 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {selectedTransaction.transactionType === 'earned' && <Star className="w-8 h-8" />}
                  {selectedTransaction.transactionType === 'awarded' && <Gift className="w-8 h-8" />}
                  {selectedTransaction.transactionType === 'bonus' && <Trophy className="w-8 h-8" />}
                  {selectedTransaction.transactionType === 'spent' && <Target className="w-8 h-8" />}
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {selectedTransaction.description}
                </h3>
                
                <div className={`text-3xl font-bold mb-2 ${
                  selectedTransaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedTransaction.amount > 0 ? '+' : ''}{selectedTransaction.amount} 🪙
                </div>
                
                <Badge variant="secondary" className="mb-4">
                  {selectedTransaction.category}
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date</span>
                  <span className="font-medium">
                    {new Date(selectedTransaction.transactionDate).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Balance After</span>
                  <span className="font-medium">{selectedTransaction.balanceAfter} 🪙</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction Type</span>
                  <span className="font-medium capitalize">{selectedTransaction.transactionType}</span>
                </div>
              </div>

              <Button 
                className="w-full mt-6" 
                onClick={() => setSelectedTransaction(null)}
              >
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}