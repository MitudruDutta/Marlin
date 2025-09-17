"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Coins, TrendingUp, Clock, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAlgorandTransaction } from "@/hooks/useAlgorandTransaction"
import { useWallet } from "@/components/WalletProvider"

export function StakingDashboard() {
  const [stakeAmount, setStakeAmount] = useState("")
  const [unstakeAmount, setUnstakeAmount] = useState("")
  const { toast } = useToast()
  const { activeAddress } = useWallet()
  const { 
    stakeTokens, 
    unstakeTokens, 
    claimRewards, 
    isLoading: isTransactionLoading 
  } = useAlgorandTransaction()

  // Mock data - in real app this would come from contract calls
  const stakingData = {
    totalStaked: 125000,
    userStaked: 5000,
    rewardBalance: 250,
    lastRewardTime: Date.now() - 3600000, // 1 hour ago
    rewardRate: 12.5, // APR percentage
    isPaused: false,
    totalRewardsDistributed: 50000,
  }

  const handleStake = async () => {
    if (!stakeAmount) {
      toast({
        title: "Invalid input",
        description: "Please enter an amount to stake",
        variant: "destructive"
      })
      return
    }

    if (!activeAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to stake tokens",
        variant: "destructive"
      })
      return
    }

    try {
      const txId = await stakeTokens(
        parseFloat(stakeAmount),
        {
          onSuccess: (txId) => {
            toast({
              title: "Staking successful",
              description: `Transaction: ${txId.slice(0, 8)}...`,
            })
            setStakeAmount("")
          }
        }
      )
    } catch (error) {
      console.error("Staking failed:", error)
    }
  }

  const handleUnstake = async () => {
    if (!unstakeAmount) {
      toast({
        title: "Invalid input",
        description: "Please enter an amount to unstake",
        variant: "destructive"
      })
      return
    }

    if (!activeAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to unstake tokens",
        variant: "destructive"
      })
      return
    }

    try {
      const txId = await unstakeTokens(
        parseFloat(unstakeAmount),
        {
          onSuccess: (txId) => {
            toast({
              title: "Unstaking successful",
              description: `Transaction: ${txId.slice(0, 8)}...`,
            })
            setUnstakeAmount("")
          }
        }
      )
    } catch (error) {
      console.error("Unstaking failed:", error)
    }
  }

  const handleClaimRewards = async () => {
    if (!activeAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to claim rewards",
        variant: "destructive"
      })
      return
    }

    try {
      const txId = await claimRewards({
        onSuccess: (txId) => {
          toast({
            title: "Rewards claimed successfully",
            description: `Transaction: ${txId.slice(0, 8)}...`,
          })
        }
      })
    } catch (error) {
      console.error("Claim rewards failed:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stakingData.totalStaked.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Tokens in protocol</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Stake</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stakingData.userStaked.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Your staked tokens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Rewards</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stakingData.rewardBalance}</div>
            <p className="text-xs text-muted-foreground">Ready to claim</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">APR</CardTitle>
            <Badge variant="secondary">{stakingData.rewardRate}%</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stakingData.rewardRate}%</div>
            <p className="text-xs text-muted-foreground">Annual percentage rate</p>
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stake Tokens</CardTitle>
            <CardDescription>Stake your tokens to earn rewards over time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stake-amount">Amount to Stake</Label>
              <Input
                id="stake-amount"
                type="number"
                placeholder="Enter amount"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                disabled={stakingData.isPaused}
              />
            </div>
            <Button 
              onClick={handleStake} 
              className="w-full" 
              disabled={!stakeAmount || stakingData.isPaused || !activeAddress || isTransactionLoading}
            >
              {isTransactionLoading ? "Staking..." : "Stake Tokens"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unstake Tokens</CardTitle>
            <CardDescription>Withdraw your staked tokens (rewards will be claimed automatically)</CardDescription>
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
              className="w-full bg-transparent"
              disabled={!unstakeAmount || stakingData.userStaked === 0 || !activeAddress || isTransactionLoading}
            >
              {isTransactionLoading ? "Unstaking..." : "Unstake Tokens"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rewards</CardTitle>
          <CardDescription>Claim your accumulated staking rewards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Available Rewards</p>
              <p className="text-2xl font-bold text-primary">{stakingData.rewardBalance} tokens</p>
            </div>
            <Button 
              onClick={handleClaimRewards} 
              disabled={stakingData.rewardBalance === 0 || !activeAddress || isTransactionLoading}
            >
              {isTransactionLoading ? "Claiming..." : "Claim Rewards"}
            </Button>
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
              <p className="text-sm font-medium mb-2">Protocol Stats</p>
              <p className="text-xs text-muted-foreground">
                Total rewards distributed: {stakingData.totalRewardsDistributed.toLocaleString()} tokens
              </p>
              <p className="text-xs text-muted-foreground">
                Last reward update: {new Date(stakingData.lastRewardTime).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
