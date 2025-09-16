"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Package, Package as Unpackage, TrendingUp, Settings, Coins, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function WrapperInterface() {
  const [wrapAmount0, setWrapAmount0] = useState("")
  const [wrapAmount1, setWrapAmount1] = useState("")
  const [unwrapAmount, setUnwrapAmount] = useState("")
  const [newYieldRate, setNewYieldRate] = useState("")
  const { toast } = useToast()

  // Mock data - in real app this would come from contract calls
  const wrapperData = {
    name: "Standardized Yield USDC",
    symbol: "SY-USDC",
    yieldRateBps: 1250, // 12.50%
    isPaused: false,
    totalSupply: 500000,
    userBalances: {
      sy: 2500,
      token0: 5000, // USDC
      token1: 3000, // aUSDC
    },
    tokenConfig: {
      token0: {
        name: "USD Coin",
        symbol: "USDC",
        ratio: 100, // 1:1 ratio
        enabled: true,
      },
      token1: {
        name: "Aave USDC",
        symbol: "aUSDC",
        ratio: 105, // 1:1.05 ratio (yield bearing)
        enabled: true,
      },
    },
    totalDeposited: {
      token0: 250000,
      token1: 150000,
    },
    protocolStats: {
      totalValueLocked: 1250000,
      totalWrappers: 15,
      totalUnwrappers: 8,
      averageYield: 11.8,
    },
  }

  const handleWrapTokens = () => {
    if (!wrapAmount0 && !wrapAmount1) return
    console.log("Wrap tokens:", { amount0: wrapAmount0, amount1: wrapAmount1 })

    const totalSY = calculateSYOutput()
    toast({
      title: "Tokens wrapped",
      description: `Wrapped tokens into ${totalSY.toFixed(2)} SY tokens`,
    })
  }

  const handleUnwrapTokens = () => {
    if (!unwrapAmount) return
    console.log("Unwrap tokens:", unwrapAmount)

    const { token0Out, token1Out } = calculateUnwrapOutput()
    toast({
      title: "Tokens unwrapped",
      description: `Unwrapped ${unwrapAmount} SY into ${token0Out.toFixed(2)} ${wrapperData.tokenConfig.token0.symbol} and ${token1Out.toFixed(2)} ${wrapperData.tokenConfig.token1.symbol}`,
    })
  }

  const handleUpdateYieldRate = () => {
    if (!newYieldRate) return
    console.log("Update yield rate:", newYieldRate)
    toast({
      title: "Yield rate updated",
      description: `New yield rate set to ${(Number.parseFloat(newYieldRate) / 100).toFixed(2)}%`,
    })
  }

  const calculateSYOutput = () => {
    const amount0 = Number.parseFloat(wrapAmount0) || 0
    const amount1 = Number.parseFloat(wrapAmount1) || 0

    // Calculate SY based on token ratios
    const sy0 = amount0 * (100 / wrapperData.tokenConfig.token0.ratio)
    const sy1 = amount1 * (100 / wrapperData.tokenConfig.token1.ratio)

    return sy0 + sy1
  }

  const calculateUnwrapOutput = () => {
    const syAmount = Number.parseFloat(unwrapAmount) || 0
    const totalRatio = wrapperData.tokenConfig.token0.ratio + wrapperData.tokenConfig.token1.ratio

    // Proportional distribution based on current pool composition
    const token0Proportion =
      wrapperData.totalDeposited.token0 / (wrapperData.totalDeposited.token0 + wrapperData.totalDeposited.token1)
    const token1Proportion = 1 - token0Proportion

    const token0Out = syAmount * token0Proportion * (wrapperData.tokenConfig.token0.ratio / 100)
    const token1Out = syAmount * token1Proportion * (wrapperData.tokenConfig.token1.ratio / 100)

    return { token0Out, token1Out }
  }

  const formatYieldRate = (bps: number) => {
    return (bps / 100).toFixed(2) + "%"
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
            <div className="text-2xl font-bold">{wrapperData.userBalances.sy.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{wrapperData.symbol}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yield Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatYieldRate(wrapperData.yieldRateBps)}</div>
            <p className="text-xs text-muted-foreground">Annual yield</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supply</CardTitle>
            <Badge variant="outline">SY</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wrapperData.totalSupply.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Wrapped tokens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TVL</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(wrapperData.protocolStats.totalValueLocked / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">Total value locked</p>
          </CardContent>
        </Card>
      </div>

      {wrapperData.isPaused && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Wrapper is currently paused</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Supported Tokens</CardTitle>
          <CardDescription>Tokens that can be wrapped into {wrapperData.symbol}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{wrapperData.tokenConfig.token0.name}</CardTitle>
                  <Badge variant={wrapperData.tokenConfig.token0.enabled ? "default" : "secondary"}>
                    {wrapperData.tokenConfig.token0.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Symbol</span>
                  <span>{wrapperData.tokenConfig.token0.symbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your Balance</span>
                  <span>{wrapperData.userBalances.token0.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pool Deposits</span>
                  <span>{wrapperData.totalDeposited.token0.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ratio</span>
                  <span>1:{(wrapperData.tokenConfig.token0.ratio / 100).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{wrapperData.tokenConfig.token1.name}</CardTitle>
                  <Badge variant={wrapperData.tokenConfig.token1.enabled ? "default" : "secondary"}>
                    {wrapperData.tokenConfig.token1.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Symbol</span>
                  <span>{wrapperData.tokenConfig.token1.symbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your Balance</span>
                  <span>{wrapperData.userBalances.token1.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pool Deposits</span>
                  <span>{wrapperData.totalDeposited.token1.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ratio</span>
                  <span>1:{(wrapperData.tokenConfig.token1.ratio / 100).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="wrap" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wrap">Wrap Tokens</TabsTrigger>
          <TabsTrigger value="unwrap">Unwrap Tokens</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </TabsList>

        <TabsContent value="wrap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Wrap Tokens into SY
              </CardTitle>
              <CardDescription>Convert your yield-bearing tokens into standardized SY tokens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="wrap-amount-0">{wrapperData.tokenConfig.token0.symbol} Amount</Label>
                  <Input
                    id="wrap-amount-0"
                    type="number"
                    placeholder="Enter amount"
                    value={wrapAmount0}
                    onChange={(e) => setWrapAmount0(e.target.value)}
                    max={wrapperData.userBalances.token0}
                    disabled={!wrapperData.tokenConfig.token0.enabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    Available: {wrapperData.userBalances.token0.toLocaleString()}{" "}
                    {wrapperData.tokenConfig.token0.symbol}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wrap-amount-1">{wrapperData.tokenConfig.token1.symbol} Amount</Label>
                  <Input
                    id="wrap-amount-1"
                    type="number"
                    placeholder="Enter amount"
                    value={wrapAmount1}
                    onChange={(e) => setWrapAmount1(e.target.value)}
                    max={wrapperData.userBalances.token1}
                    disabled={!wrapperData.tokenConfig.token1.enabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    Available: {wrapperData.userBalances.token1.toLocaleString()}{" "}
                    {wrapperData.tokenConfig.token1.symbol}
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">You will receive:</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">SY</Badge>
                  <span className="text-lg font-bold">
                    {calculateSYOutput().toFixed(6)} {wrapperData.symbol}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Conversion based on current token ratios and yield rates
                </p>
              </div>

              <Button
                onClick={handleWrapTokens}
                className="w-full"
                disabled={(!wrapAmount0 && !wrapAmount1) || wrapperData.isPaused}
              >
                <Package className="h-4 w-4 mr-2" />
                Wrap Tokens
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unwrap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Unpackage className="h-5 w-5" />
                Unwrap SY Tokens
              </CardTitle>
              <CardDescription>Convert your SY tokens back to underlying yield-bearing tokens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="unwrap-amount">SY Amount to Unwrap</Label>
                <Input
                  id="unwrap-amount"
                  type="number"
                  placeholder="Enter SY amount"
                  value={unwrapAmount}
                  onChange={(e) => setUnwrapAmount(e.target.value)}
                  max={wrapperData.userBalances.sy}
                />
                <p className="text-xs text-muted-foreground">
                  Available: {wrapperData.userBalances.sy.toLocaleString()} {wrapperData.symbol}
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">You will receive approximately:</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{wrapperData.tokenConfig.token0.symbol}</Badge>
                      <span>{calculateUnwrapOutput().token0Out.toFixed(6)} tokens</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{wrapperData.tokenConfig.token1.symbol}</Badge>
                      <span>{calculateUnwrapOutput().token1Out.toFixed(6)} tokens</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Distribution based on current pool composition</p>
              </div>

              <Button
                onClick={handleUnwrapTokens}
                className="w-full"
                disabled={!unwrapAmount || wrapperData.userBalances.sy === 0}
              >
                <Unpackage className="h-4 w-4 mr-2" />
                Unwrap Tokens
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Update Yield Rate
              </CardTitle>
              <CardDescription>Adjust the yield rate for the wrapper (Admin only)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-yield-rate">New Yield Rate (basis points)</Label>
                <Input
                  id="new-yield-rate"
                  type="number"
                  placeholder="Enter yield rate in bps"
                  value={newYieldRate}
                  onChange={(e) => setNewYieldRate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Current: {wrapperData.yieldRateBps} bps ({formatYieldRate(wrapperData.yieldRateBps)})
                </p>
                <p className="text-xs text-muted-foreground">Example: 1250 bps = 12.50%</p>
              </div>

              <Button onClick={handleUpdateYieldRate} className="w-full" disabled={!newYieldRate}>
                <Settings className="h-4 w-4 mr-2" />
                Update Yield Rate
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Protocol Statistics</CardTitle>
              <CardDescription>Overview of wrapper protocol activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {wrapperData.protocolStats.totalWrappers.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Wraps</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-chart-2">
                    {wrapperData.protocolStats.totalUnwrappers.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Unwraps</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-chart-3">
                    ${(wrapperData.protocolStats.totalValueLocked / 1000).toFixed(0)}K
                  </p>
                  <p className="text-sm text-muted-foreground">TVL</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-chart-4">
                    {wrapperData.protocolStats.averageYield.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Yield</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Token Configuration</CardTitle>
              <CardDescription>Enable or disable tokens for wrapping</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">
                    {wrapperData.tokenConfig.token0.name} ({wrapperData.tokenConfig.token0.symbol})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ratio: 1:{(wrapperData.tokenConfig.token0.ratio / 100).toFixed(2)}
                  </p>
                </div>
                <Switch
                  checked={wrapperData.tokenConfig.token0.enabled}
                  onCheckedChange={() => {
                    toast({
                      title: "Token configuration updated",
                      description: `${wrapperData.tokenConfig.token0.symbol} ${wrapperData.tokenConfig.token0.enabled ? "disabled" : "enabled"}`,
                    })
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">
                    {wrapperData.tokenConfig.token1.name} ({wrapperData.tokenConfig.token1.symbol})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ratio: 1:{(wrapperData.tokenConfig.token1.ratio / 100).toFixed(2)}
                  </p>
                </div>
                <Switch
                  checked={wrapperData.tokenConfig.token1.enabled}
                  onCheckedChange={() => {
                    toast({
                      title: "Token configuration updated",
                      description: `${wrapperData.tokenConfig.token1.symbol} ${wrapperData.tokenConfig.token1.enabled ? "disabled" : "enabled"}`,
                    })
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
