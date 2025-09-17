"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Coins, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  Brain,
  Zap,
  Bell
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAIAgent } from "@/hooks/useAIAgent"
import { useAutomatedRecommendations } from "@/hooks/useAutomatedRecommendations"
import { useAlgorandContractRead } from "@/hooks/useAlgorandContractRead"
import { useAlgorandContractWrite } from "@/hooks/useAlgorandContractWrite"
import { StakingDappClient } from "@/hooks/contracts/StakingDapp"

// Contract configuration - in production this should come from environment variables
const STAKING_CONTRACT_ID = process.env.NEXT_PUBLIC_STAKING_CONTRACT_ID || ""

export function EnhancedStakingDashboard() {
  const [stakeAmount, setStakeAmount] = useState("")
  const [unstakeAmount, setUnstakeAmount] = useState("")
  const [autoStakeEnabled, setAutoStakeEnabled] = useState(false)
  const { toast } = useToast()

  const { 
    isHealthy, 
    latestCoinData, 
    latestOptimization,
    getOptimization 
  } = useAIAgent()

  const {
    config: automationConfig,
    updateConfig: updateAutomationConfig,
    alerts,
    isRunning: isAutomationRunning,
    performanceMetrics,
    dismissAlert
  } = useAutomatedRecommendations()

  // Contract read hooks for staking data
  const { data: userInfo } = useAlgorandContractRead(
    ['staking', 'userInfo', STAKING_CONTRACT_ID],
    async () => {
      if (!STAKING_CONTRACT_ID) return null
      const client = new StakingDappClient({
        id: BigInt(STAKING_CONTRACT_ID),
        algorand: {} as any
      })
      return await client.getUserInfo()
    },
    { enabled: !!STAKING_CONTRACT_ID }
  )

  const { data: stakingInfo } = useAlgorandContractRead(
    ['staking', 'stakingInfo', STAKING_CONTRACT_ID],
    async () => {
      if (!STAKING_CONTRACT_ID) return null
      const client = new StakingDappClient(
        { resolveBy: 'id', id: BigInt(STAKING_CONTRACT_ID) },
        {} as any
      )
      return await client.getStakingInfo()
    },
    { enabled: !!STAKING_CONTRACT_ID }
  )

  const { data: pendingRewards } = useAlgorandContractRead(
    ['staking', 'pendingRewards', STAKING_CONTRACT_ID],
    async () => {
      if (!STAKING_CONTRACT_ID) return null
      const client = new StakingDappClient(
        { resolveBy: 'id', id: BigInt(STAKING_CONTRACT_ID) },
        {} as any
      )
      return await client.calculatePendingRewards()
    },
    { 
      enabled: !!STAKING_CONTRACT_ID,
      refetchInterval: 10000 // Refetch every 10 seconds for real-time updates
    }
  )

  const { data: isPaused } = useAlgorandContractRead(
    ['staking', 'isPaused', STAKING_CONTRACT_ID],
    async () => {
      if (!STAKING_CONTRACT_ID) return null
      const client = new StakingDappClient(
        { resolveBy: 'id', id: BigInt(STAKING_CONTRACT_ID) },
        {} as any
      )
      return await client.isStakingPaused()
    },
    { enabled: !!STAKING_CONTRACT_ID }
  )

  // Contract write hooks for staking operations
  const stakeMutation = useAlgorandContractWrite(
    async (amount: number) => {
      if (!STAKING_CONTRACT_ID) throw new Error('Contract ID not configured')
      const client = new StakingDappClient(
        { resolveBy: 'id', id: BigInt(STAKING_CONTRACT_ID) },
        {} as any
      )
      return await client.stake({ amount: BigInt(amount) })
    },
    {
      onSuccess: () => {
        toast({
          title: "Stake transaction successful",
          description: `Successfully staked ${stakeAmount} ALGO tokens`,
        })
        setStakeAmount("")
      },
      onError: (error) => {
        toast({
          title: "Stake transaction failed",
          description: error.message,
          variant: "destructive"
        })
      },
      invalidateQueries: [
        ['staking', 'userInfo', STAKING_CONTRACT_ID],
        ['staking', 'stakingInfo', STAKING_CONTRACT_ID],
        ['staking', 'pendingRewards', STAKING_CONTRACT_ID]
      ]
    }
  )

  const unstakeMutation = useAlgorandContractWrite(
    async (amount: number) => {
      if (!STAKING_CONTRACT_ID) throw new Error('Contract ID not configured')
      const client = new StakingDappClient(
        { resolveBy: 'id', id: BigInt(STAKING_CONTRACT_ID) },
        {} as any
      )
      return await client.unstake({ amount: BigInt(amount) })
    },
    {
      onSuccess: () => {
        toast({
          title: "Unstake transaction successful",
          description: `Successfully unstaked ${unstakeAmount} ALGO tokens`,
        })
        setUnstakeAmount("")
      },
      onError: (error) => {
        toast({
          title: "Unstake transaction failed",
          description: error.message,
          variant: "destructive"
        })
      },
      invalidateQueries: [
        ['staking', 'userInfo', STAKING_CONTRACT_ID],
        ['staking', 'stakingInfo', STAKING_CONTRACT_ID],
        ['staking', 'pendingRewards', STAKING_CONTRACT_ID]
      ]
    }
  )

  const claimRewardsMutation = useAlgorandContractWrite(
    async () => {
      if (!STAKING_CONTRACT_ID) throw new Error('Contract ID not configured')
      const client = new StakingDappClient(
        { resolveBy: 'id', id: BigInt(STAKING_CONTRACT_ID) },
        {} as any
      )
      return await client.claimRewards()
    },
    {
      onSuccess: () => {
        toast({
          title: "Rewards claimed successfully",
          description: `Claimed ${stakingData.rewardBalance} ALGO tokens`,
        })
      },
      onError: (error) => {
        toast({
          title: "Claim rewards failed",
          description: error.message,
          variant: "destructive"
        })
      },
      invalidateQueries: [
        ['staking', 'userInfo', STAKING_CONTRACT_ID],
        ['staking', 'stakingInfo', STAKING_CONTRACT_ID],
        ['staking', 'pendingRewards', STAKING_CONTRACT_ID]
      ]
    }
  )

  const compoundRewardsMutation = useAlgorandContractWrite(
    async () => {
      if (!STAKING_CONTRACT_ID) throw new Error('Contract ID not configured')
      const client = new StakingDappClient(
        { resolveBy: 'id', id: BigInt(STAKING_CONTRACT_ID) },
        {} as any
      )
      return await client.compoundRewards()
    },
    {
      onSuccess: () => {
        toast({
          title: "Rewards compounded successfully",
          description: "Your rewards have been automatically restaked",
        })
      },
      onError: (error) => {
        toast({
          title: "Compound rewards failed",
          description: error.message,
          variant: "destructive"
        })
      },
      invalidateQueries: [
        ['staking', 'userInfo', STAKING_CONTRACT_ID],
        ['staking', 'stakingInfo', STAKING_CONTRACT_ID],
        ['staking', 'pendingRewards', STAKING_CONTRACT_ID]
      ]
    }
  )

  // Real data from smart contract with fallbacks
  const stakingData = {
    totalStaked: stakingInfo?.return ? Number(stakingInfo.return[0]) : 0,
    userStaked: userInfo?.return ? Number(userInfo.return[0]) : 0,
    rewardBalance: userInfo?.return ? Number(userInfo.return[1]) : 0,
    totalRewards: userInfo?.return ? Number(userInfo.return[2]) : 0,
    lastRewardTime: Date.now() - 3600000, // This would need to be tracked
    rewardRate: 12.5, // APR percentage - could be calculated from contract data
    isPaused: Boolean(isPaused?.return),
    totalRewardsDistributed: stakingInfo?.return ? Number(stakingInfo.return[1]) : 0,
    rewardAmount: stakingInfo?.return ? Number(stakingInfo.return[2]) : 0,
    rewardInterval: stakingInfo?.return ? Number(stakingInfo.return[3]) : 0,
    pendingRewards: pendingRewards?.return ? Number(pendingRewards.return) : 0,
    optimalStakeAmount: latestOptimization ? 
      Math.round(1000 * latestOptimization.recommended_split.PT) : 3000,
    predictedAPR: latestOptimization ? 
      12.5 + (latestOptimization.prediction.trend_estimate * 100) : 12.5,
  }

  // AI-enhanced staking recommendations
  const getStakingRecommendation = async () => {
    if (!isHealthy) return

    try {
      const recommendation = await getOptimization({
        coin_id: 'algorand',
        risk_profile: 'moderate',
        maturity_months: 6,
        amount_algo: parseFloat(stakeAmount) || 1000
      })

      toast({
        title: "AI Recommendation Generated",
        description: `Optimal stake: ${Math.round(1000 * recommendation.recommended_split.PT)} ALGO`,
      })
    } catch (error) {
      toast({
        title: "Recommendation Failed",
        description: "Unable to generate AI recommendation",
        variant: "destructive"
      })
    }
  }

  const handleStake = async () => {
    if (!stakeAmount || isNaN(parseFloat(stakeAmount))) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid stake amount",
        variant: "destructive"
      })
      return
    }

    const amount = parseFloat(stakeAmount)
    
    // Check if amount is close to AI recommendation
    if (stakingData.optimalStakeAmount && Math.abs(amount - stakingData.optimalStakeAmount) > stakingData.optimalStakeAmount * 0.1) {
      toast({
        title: "Amount differs from AI recommendation",
        description: `AI suggests ${stakingData.optimalStakeAmount} ALGO for optimal returns`,
        variant: "default"
      })
    }
    
    // Execute contract transaction
    try {
      await stakeMutation.mutateAsync(amount)
    } catch (error) {
      console.error("Staking failed:", error)
    }
  }

  const handleUnstake = async () => {
    if (!unstakeAmount || isNaN(parseFloat(unstakeAmount))) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid unstake amount",
        variant: "destructive"
      })
      return
    }

    const amount = parseFloat(unstakeAmount)
    
    if (amount > stakingData.userStaked) {
      toast({
        title: "Insufficient staked balance",
        description: `You can only unstake up to ${stakingData.userStaked} ALGO`,
        variant: "destructive"
      })
      return
    }
    
    // Execute contract transaction
    try {
      await unstakeMutation.mutateAsync(amount)
    } catch (error) {
      console.error("Unstaking failed:", error)
    }
  }

  const handleClaimRewards = async () => {
    if (stakingData.rewardBalance <= 0 && stakingData.pendingRewards <= 0) {
      toast({
        title: "No rewards to claim",
        description: "You don't have any rewards available to claim",
        variant: "destructive"
      })
      return
    }
    
    // Execute contract transaction
    try {
      await claimRewardsMutation.mutateAsync()
    } catch (error) {
      console.error("Claiming rewards failed:", error)
    }
  }

  const handleAutoStakeToggle = (enabled: boolean) => {
    setAutoStakeEnabled(enabled)
    updateAutomationConfig({ enabled })
    
    toast({
      title: enabled ? "Auto-staking enabled" : "Auto-staking disabled",
      description: enabled 
        ? "AI will monitor and recommend optimal staking strategies"
        : "Automatic monitoring has been disabled",
    })
  }

  // Auto-fill optimal amount
  const useOptimalAmount = () => {
    setStakeAmount(stakingData.optimalStakeAmount.toString())
  }

  const recentAlerts = alerts.slice(0, 3) // Show only recent 3 alerts

  return (
    <div className="space-y-6">
      {/* AI Integration Status */}
      <Card className={`border-l-4 ${isHealthy ? 'border-l-green-500' : 'border-l-orange-500'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">AI-Enhanced Staking</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isAutomationRunning ? "default" : "secondary"}>
                {isAutomationRunning ? "Auto-Active" : "Manual"}
              </Badge>
              <Badge variant={isHealthy ? "default" : "destructive"}>
                {isHealthy ? "AI Ready" : "AI Limited"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {stakingData.optimalStakeAmount.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">AI Optimal Stake (ALGO)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {stakingData.predictedAPR.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">Predicted APR</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {performanceMetrics.totalRecommendations}
              </p>
              <p className="text-sm text-muted-foreground">AI Recommendations</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stakingData.totalStaked.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Pool: ${(stakingData.totalStaked * (latestCoinData?.current_price || 1.8)).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Stake</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stakingData.userStaked.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">Value:</span>
              <span className="font-medium">
                ${(stakingData.userStaked * (latestCoinData?.current_price || 1.8)).toFixed(0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Rewards</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stakingData.rewardBalance + stakingData.pendingRewards).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stakingData.pendingRewards > 0 && (
                <span className="text-green-500">
                  +{stakingData.pendingRewards} pending • 
                </span>
              )}
              {stakingData.userStaked > 0 ? 
                `+${(((stakingData.rewardBalance + stakingData.pendingRewards) / stakingData.userStaked) * 100).toFixed(2)}% return` :
                "No tokens staked"
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live APR</CardTitle>
            <Badge variant="secondary">{stakingData.predictedAPR.toFixed(1)}%</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stakingData.predictedAPR.toFixed(1)}%</div>
            <div className="flex items-center gap-1 text-xs">
              {latestOptimization?.prediction?.trend_estimate && (
                <>
                  <TrendingUp className={`h-3 w-3 ${latestOptimization.prediction.trend_estimate > 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={latestOptimization.prediction.trend_estimate > 0 ? 'text-green-500' : 'text-red-500'}>
                    {latestOptimization.prediction.trend_estimate > 0 ? '+' : ''}
                    {(latestOptimization.prediction.trend_estimate * 100).toFixed(1)}%
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {stakingData.isPaused && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Staking is currently paused</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent AI Alerts */}
      {recentAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent AI Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className={`h-2 w-2 rounded-full mt-2 ${
                    alert.type === 'opportunity' ? 'bg-green-500' :
                    alert.type === 'warning' ? 'bg-orange-500' :
                    alert.type === 'info' ? 'bg-blue-500' : 'bg-gray-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => dismissAlert(alert.id)}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="stake" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stake">Stake & Unstake</TabsTrigger>
          <TabsTrigger value="rewards">Rewards & Analytics</TabsTrigger>
          <TabsTrigger value="automation">AI Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="stake" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Stake Tokens
                  {isHealthy && (
                    <Button size="sm" variant="outline" onClick={getStakingRecommendation}>
                      <Brain className="h-3 w-3 mr-1" />
                      AI Suggest
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>Stake your ALGO tokens to earn rewards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="stake-amount">Amount to Stake</Label>
                    {stakingData.optimalStakeAmount && (
                      <Button 
                        size="sm" 
                        variant="link" 
                        onClick={useOptimalAmount}
                        className="h-auto p-0 text-xs"
                      >
                        Use AI Optimal: {stakingData.optimalStakeAmount}
                      </Button>
                    )}
                  </div>
                  <Input
                    id="stake-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    disabled={stakingData.isPaused}
                  />
                  {stakeAmount && stakingData.optimalStakeAmount && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Difference from AI optimal: </span>
                      <span className={
                        Math.abs(parseFloat(stakeAmount) - stakingData.optimalStakeAmount) > stakingData.optimalStakeAmount * 0.1 
                          ? 'text-orange-500 font-medium' 
                          : 'text-green-500'
                      }>
                        {parseFloat(stakeAmount) > stakingData.optimalStakeAmount ? '+' : ''}
                        {(parseFloat(stakeAmount) - stakingData.optimalStakeAmount).toFixed(0)} ALGO
                      </span>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handleStake} 
                  className="w-full" 
                  disabled={!stakeAmount || stakingData.isPaused || stakeMutation.isPending}
                >
                  <Coins className="h-4 w-4 mr-2" />
                  {stakeMutation.isPending ? "Staking..." : "Stake Tokens"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Unstake Tokens</CardTitle>
                <CardDescription>Withdraw your staked tokens (rewards claimed automatically)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="unstake-amount">Amount to Unstake</Label>
                  <Input
                    id="unstake-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    max={stakingData.userStaked}
                  />
                  <p className="text-xs text-muted-foreground">Max: {stakingData.userStaked.toLocaleString()} tokens</p>
                </div>
                <Button
                  onClick={handleUnstake}
                  variant="outline"
                  className="w-full"
                  disabled={!unstakeAmount || stakingData.userStaked === 0 || unstakeMutation.isPending}
                >
                  {unstakeMutation.isPending ? "Unstaking..." : "Unstake Tokens"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rewards & Performance</CardTitle>
              <CardDescription>Track your staking rewards and performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Available Rewards</p>
                  <p className="text-2xl font-bold text-primary">
                    {(stakingData.rewardBalance + stakingData.pendingRewards).toLocaleString()} ALGO
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Worth ~${((stakingData.rewardBalance + stakingData.pendingRewards) * (latestCoinData?.current_price || 1.8)).toFixed(2)}
                    {stakingData.pendingRewards > 0 && (
                      <span className="block text-orange-500 mt-1">
                        {stakingData.pendingRewards} pending rewards
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleClaimRewards} 
                    disabled={stakingData.rewardBalance === 0 && stakingData.pendingRewards === 0 || claimRewardsMutation.isPending}
                  >
                    {claimRewardsMutation.isPending ? "Claiming..." : "Claim Rewards"}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => compoundRewardsMutation.mutate()}
                    disabled={stakingData.rewardBalance === 0 && stakingData.pendingRewards === 0 || compoundRewardsMutation.isPending}
                  >
                    {compoundRewardsMutation.isPending ? "Compounding..." : "Compound"}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium mb-2">Staking Progress</p>
                  <Progress value={(stakingData.userStaked / stakingData.totalStaked) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {((stakingData.userStaked / stakingData.totalStaked) * 100).toFixed(2)}% of total pool
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Performance vs AI Optimal</p>
                  <Progress 
                    value={Math.min((stakingData.userStaked / stakingData.optimalStakeAmount) * 100, 100)} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {((stakingData.userStaked / stakingData.optimalStakeAmount) * 100).toFixed(0)}% of AI recommended amount
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3 text-center">
                <div>
                  <p className="text-lg font-bold text-primary">
                    {stakingData.totalRewardsDistributed.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Rewards Distributed</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">
                    {new Date(stakingData.lastRewardTime).toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Last Reward Update</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-600">
                    {(stakingData.rewardRate * (stakingData.userStaked / 365)).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Daily Expected Rewards</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Automation Settings
              </CardTitle>
              <CardDescription>Configure automated staking optimization and monitoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-stake">Auto-optimization</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable AI-powered automatic staking recommendations
                  </p>
                </div>
                <Switch
                  id="auto-stake"
                  checked={autoStakeEnabled}
                  onCheckedChange={handleAutoStakeToggle}
                  disabled={!isHealthy}
                />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Performance Metrics</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>AI Recommendations</span>
                      <span className="font-medium">{performanceMetrics.totalRecommendations}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Success Rate</span>
                      <span className="font-medium">{performanceMetrics.successRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Automation Status</span>
                      <Badge variant={isAutomationRunning ? "default" : "secondary"}>
                        {isAutomationRunning ? "Running" : "Stopped"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Real-time Monitoring</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Price Monitoring</span>
                      <Badge variant={latestCoinData ? "default" : "secondary"}>
                        {latestCoinData ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Trend Analysis</span>
                      <Badge variant={latestOptimization ? "default" : "secondary"}>
                        {latestOptimization ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Alert System</span>
                      <Badge variant={automationConfig.alertsEnabled ? "default" : "secondary"}>
                        {automationConfig.alertsEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
