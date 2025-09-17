"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Split, Merge, Clock, Calendar, TrendingUp, Coins } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAlgorandTransaction } from "@/hooks/useAlgorandTransaction"
import { useWallet } from "@/components/WalletProvider"

export function AMMInterface() {
  const [splitAmount, setSplitAmount] = useState("")
  const [selectedMaturity, setSelectedMaturity] = useState("")
  const [redeemAmount, setRedeemAmount] = useState("")
  const [redeemMaturity, setRedeemMaturity] = useState("")
  const [newMaturityDate, setNewMaturityDate] = useState("")
  const { toast } = useToast()
  const { activeAddress } = useWallet()
  const { 
    splitTokens, 
    redeemTokens, 
    createMaturity, 
    isLoading: isTransactionLoading 
  } = useAlgorandTransaction()

  // Mock data - in real app this would come from contract calls
  const tokenizationData = {
    baseName: "Standardized Yield",
    baseSymbol: "SY-USDC",
    isPaused: false,
    maturityCount: 3,
    userBalances: {
      sy: 10000,
      pt: 2500,
      yt: 2500,
    },
    maturities: [
      {
        timestamp: new Date("2024-06-30").getTime(),
        label: "Jun 2024",
        ptSupply: 50000,
        ytSupply: 50000,
        isActive: true,
        daysToMaturity: 90,
      },
      {
        timestamp: new Date("2024-12-31").getTime(),
        label: "Dec 2024",
        ptSupply: 75000,
        ytSupply: 75000,
        isActive: true,
        daysToMaturity: 270,
      },
      {
        timestamp: new Date("2025-06-30").getTime(),
        label: "Jun 2025",
        ptSupply: 25000,
        ytSupply: 25000,
        isActive: true,
        daysToMaturity: 450,
      },
    ],
    totalValueLocked: 1500000,
    totalSplits: 15000,
    totalRedemptions: 8500,
  }

  const handleSplitTokens = async () => {
    if (!splitAmount || !selectedMaturity) {
      toast({
        title: "Invalid input",
        description: "Please enter amount and select maturity",
        variant: "destructive"
      })
      return
    }

    if (!activeAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to split tokens",
        variant: "destructive"
      })
      return
    }

    try {
      const txId = await splitTokens(
        parseFloat(splitAmount),
        parseInt(selectedMaturity),
        {
          onSuccess: (txId) => {
            toast({
              title: "Tokens split successfully",
              description: `Transaction: ${txId.slice(0, 8)}...`,
            })
            setSplitAmount("")
            setSelectedMaturity("")
          }
        }
      )
    } catch (error) {
      console.error("Token split failed:", error)
    }
  }

  const handleRedeemTokens = async () => {
    if (!redeemAmount || !redeemMaturity) {
      toast({
        title: "Invalid input",
        description: "Please enter amount and select maturity",
        variant: "destructive"
      })
      return
    }

    if (!activeAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to redeem tokens",
        variant: "destructive"
      })
      return
    }

    try {
      const txId = await redeemTokens(
        parseFloat(redeemAmount),
        parseInt(redeemMaturity),
        {
          onSuccess: (txId) => {
            toast({
              title: "Tokens redeemed successfully",
              description: `Transaction: ${txId.slice(0, 8)}...`,
            })
            setRedeemAmount("")
            setRedeemMaturity("")
          }
        }
      )
    } catch (error) {
      console.error("Token redemption failed:", error)
    }
  }

  const handleCreateMaturity = async () => {
    if (!newMaturityDate) {
      toast({
        title: "Invalid input",
        description: "Please select a maturity date",
        variant: "destructive"
      })
      return
    }

    if (!activeAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create maturity",
        variant: "destructive"
      })
      return
    }

    try {
      const txId = await createMaturity(
        newMaturityDate,
        {
          onSuccess: (txId) => {
            toast({
              title: "Maturity created successfully",
              description: `Transaction: ${txId.slice(0, 8)}...`,
            })
            setNewMaturityDate("")
          }
        }
      )
    } catch (error) {
      console.error("Maturity creation failed:", error)
    }
  }

  const getMaturityStatus = (timestamp: number) => {
    const now = Date.now()
    const daysLeft = Math.floor((timestamp - now) / (1000 * 60 * 60 * 24))

    if (daysLeft < 0) return { status: "Matured", variant: "secondary" as const }
    if (daysLeft < 30) return { status: "Expiring Soon", variant: "destructive" as const }
    return { status: "Active", variant: "default" as const }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SY Balance</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokenizationData.userBalances.sy.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Standardized Yield tokens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PT Balance</CardTitle>
            <Badge variant="outline">Principal</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokenizationData.userBalances.pt.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Principal tokens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">YT Balance</CardTitle>
            <Badge variant="outline">Yield</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokenizationData.userBalances.yt.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Yield tokens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TVL</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(tokenizationData.totalValueLocked / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">Total value locked</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Maturities</CardTitle>
          <CardDescription>Current maturity options for tokenization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {tokenizationData.maturities.map((maturity, index) => {
              const status = getMaturityStatus(maturity.timestamp)
              return (
                <Card key={index} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{maturity.label}</CardTitle>
                      <Badge variant={status.variant}>{status.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">PT Supply</span>
                      <span>{maturity.ptSupply.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">YT Supply</span>
                      <span>{maturity.ytSupply.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Days to Maturity</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {maturity.daysToMaturity}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="split" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="split">Split Tokens</TabsTrigger>
          <TabsTrigger value="redeem">Redeem Tokens</TabsTrigger>
          <TabsTrigger value="manage">Manage Maturities</TabsTrigger>
        </TabsList>

        <TabsContent value="split" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Split className="h-5 w-5" />
                Split SY into PT + YT
              </CardTitle>
              <CardDescription>
                Convert your SY tokens into Principal and Yield tokens for a specific maturity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="split-amount">SY Amount to Split</Label>
                  <Input
                    id="split-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={splitAmount}
                    onChange={(e) => setSplitAmount(e.target.value)}
                    max={tokenizationData.userBalances.sy}
                  />
                  <p className="text-xs text-muted-foreground">
                    Available: {tokenizationData.userBalances.sy.toLocaleString()} SY
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Select Maturity</Label>
                  <Select value={selectedMaturity} onValueChange={setSelectedMaturity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose maturity date" />
                    </SelectTrigger>
                    <SelectContent>
                      {tokenizationData.maturities.map((maturity, index) => (
                        <SelectItem key={index} value={maturity.timestamp.toString()}>
                          {maturity.label} ({maturity.daysToMaturity} days)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">You will receive:</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">PT</Badge>
                    <span>{splitAmount || "0"} Principal Tokens</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">YT</Badge>
                    <span>{splitAmount || "0"} Yield Tokens</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSplitTokens}
                className="w-full"
                disabled={!splitAmount || !selectedMaturity || tokenizationData.isPaused || !activeAddress || isTransactionLoading}
              >
                <Split className="h-4 w-4 mr-2" />
                {isTransactionLoading ? "Splitting..." : "Split Tokens"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redeem" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Merge className="h-5 w-5" />
                Redeem PT for SY
              </CardTitle>
              <CardDescription>Redeem your Principal Tokens for underlying SY tokens at maturity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="redeem-amount">PT Amount to Redeem</Label>
                  <Input
                    id="redeem-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    max={tokenizationData.userBalances.pt}
                  />
                  <p className="text-xs text-muted-foreground">
                    Available: {tokenizationData.userBalances.pt.toLocaleString()} PT
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Select Maturity</Label>
                  <Select value={redeemMaturity} onValueChange={setRedeemMaturity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose maturity date" />
                    </SelectTrigger>
                    <SelectContent>
                      {tokenizationData.maturities.map((maturity, index) => {
                        const isMatured = maturity.timestamp <= Date.now()
                        return (
                          <SelectItem key={index} value={maturity.timestamp.toString()} disabled={!isMatured}>
                            {maturity.label} {isMatured ? "(Matured)" : "(Not matured)"}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">You will receive:</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">SY</Badge>
                  <span>{redeemAmount || "0"} Standardized Yield Tokens</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">1:1 redemption ratio at maturity</p>
              </div>

              <Button 
                onClick={handleRedeemTokens} 
                className="w-full" 
                disabled={!redeemAmount || !redeemMaturity || !activeAddress || isTransactionLoading}
              >
                <Merge className="h-4 w-4 mr-2" />
                {isTransactionLoading ? "Redeeming..." : "Redeem Tokens"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Create New Maturity
              </CardTitle>
              <CardDescription>Add a new maturity date for tokenization (Admin only)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-maturity">Maturity Date</Label>
                <Input
                  id="new-maturity"
                  type="date"
                  value={newMaturityDate}
                  onChange={(e) => setNewMaturityDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <Button 
                onClick={handleCreateMaturity} 
                className="w-full" 
                disabled={!newMaturityDate || !activeAddress || isTransactionLoading}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {isTransactionLoading ? "Creating..." : "Create Maturity"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Protocol Statistics</CardTitle>
              <CardDescription>Overview of tokenization protocol activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{tokenizationData.totalSplits.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Splits</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-chart-2">
                    {tokenizationData.totalRedemptions.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Redemptions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-chart-3">{tokenizationData.maturityCount}</p>
                  <p className="text-sm text-muted-foreground">Active Maturities</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
