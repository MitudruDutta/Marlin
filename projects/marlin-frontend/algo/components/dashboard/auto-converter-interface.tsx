"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Bot, ArrowRightLeft, Settings, Zap, TrendingUp, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function AutoConverterInterface() {
  const [conversionEnabled, setConversionEnabled] = useState(false)
  const [thresholdPrice, setThresholdPrice] = useState("")
  const [maturityDate, setMaturityDate] = useState("")
  const [depositAmount, setDepositAmount] = useState("")
  const [minPtAmount, setMinPtAmount] = useState("")
  const [deadline, setDeadline] = useState("")
  const { toast } = useToast()

  // Mock data - in real app this would come from contract calls
  const converterData = {
    isEnabled: true,
    userThresholdPrice: 1.25,
    userMaturity: new Date("2024-12-31").getTime(),
    conversionExecuted: false,
    ytBalance: 1500,
    ptBalance: 750,
    totalConversions: 2847,
    conversionFee: 0.1, // 0.1%
    isPaused: false,
    currentPrice: 1.18,
    priceProgress: 94.4, // (1.18/1.25) * 100
    oracleAddress: "0x1234...oracle",
    tokenizationAddress: "0x5678...tokenization",
    ammAddress: "0x9abc...amm",
    conversionHistory: [
      { date: "2024-01-15", ytAmount: 1000, ptAmount: 950, price: 1.05 },
      { date: "2024-01-10", ytAmount: 500, ptAmount: 475, price: 1.05 },
      { date: "2024-01-05", ytAmount: 2000, ptAmount: 1900, price: 1.05 },
    ],
  }

  const handleConfigureConversion = () => {
    if (!thresholdPrice || !maturityDate) return
    console.log("Configure conversion:", {
      enabled: conversionEnabled,
      threshold: thresholdPrice,
      maturity: maturityDate,
    })
    toast({
      title: "Conversion configured",
      description: `Auto-conversion ${conversionEnabled ? "enabled" : "disabled"} with threshold $${thresholdPrice}`,
    })
  }

  const handleDepositYT = () => {
    if (!depositAmount) return
    console.log("Deposit YT:", depositAmount)
    toast({
      title: "YT tokens deposited",
      description: `Deposited ${depositAmount} YT tokens for auto-conversion`,
    })
  }

  const handleExecuteConversion = () => {
    if (!minPtAmount || !deadline) return
    console.log("Execute conversion:", { minPtAmount, deadline })
    toast({
      title: "Conversion executed",
      description: `Converting YT to PT with minimum ${minPtAmount} PT tokens`,
    })
  }

  const formatTimeToMaturity = (maturity: number) => {
    const now = Date.now()
    const timeLeft = maturity - now
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
    return days > 0 ? `${days} days` : "Matured"
  }

  const getConversionStatus = () => {
    if (!converterData.isEnabled) return { status: "Disabled", variant: "secondary" as const }
    if (converterData.conversionExecuted) return { status: "Executed", variant: "default" as const }
    if (converterData.currentPrice >= converterData.userThresholdPrice)
      return { status: "Ready", variant: "default" as const }
    return { status: "Monitoring", variant: "secondary" as const }
  }

  const conversionStatus = getConversionStatus()

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">YT Balance</CardTitle>
            <Badge variant="outline">Yield</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{converterData.ytBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Available for conversion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PT Balance</CardTitle>
            <Badge variant="outline">Principal</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{converterData.ptBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From conversions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Badge variant={conversionStatus.variant}>{conversionStatus.status}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{conversionStatus.status}</div>
            <p className="text-xs text-muted-foreground">Conversion state</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{converterData.totalConversions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Protocol-wide</p>
          </CardContent>
        </Card>
      </div>

      {converterData.isPaused && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Auto-converter is currently paused</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Price Threshold Monitor
          </CardTitle>
          <CardDescription>Current price progress towards your conversion threshold</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Current Price: ${converterData.currentPrice.toFixed(4)}</span>
              <span>Target: ${converterData.userThresholdPrice.toFixed(4)}</span>
            </div>
            <Progress value={converterData.priceProgress} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">
              {converterData.priceProgress.toFixed(1)}% of threshold reached
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm font-medium mb-1">Maturity</p>
              <p className="text-xs text-muted-foreground">
                {formatTimeToMaturity(converterData.userMaturity)} remaining
              </p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm font-medium mb-1">Conversion Fee</p>
              <p className="text-xs text-muted-foreground">{converterData.conversionFee}% of converted amount</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="configure" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configure">Configure</TabsTrigger>
          <TabsTrigger value="deposit">Deposit YT</TabsTrigger>
          <TabsTrigger value="execute">Execute</TabsTrigger>
        </TabsList>

        <TabsContent value="configure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configure Auto-Conversion
              </CardTitle>
              <CardDescription>Set up automatic YT to PT conversion parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Auto-Conversion</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically convert YT to PT when threshold is reached
                  </p>
                </div>
                <Switch checked={conversionEnabled} onCheckedChange={setConversionEnabled} />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="threshold-price">Threshold Price</Label>
                  <Input
                    id="threshold-price"
                    type="number"
                    step="0.0001"
                    placeholder="Enter threshold price"
                    value={thresholdPrice}
                    onChange={(e) => setThresholdPrice(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Current: ${converterData.userThresholdPrice.toFixed(4)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maturity-date">Maturity Date</Label>
                  <Input
                    id="maturity-date"
                    type="date"
                    value={maturityDate}
                    onChange={(e) => setMaturityDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">How it works:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Monitor price oracle for threshold breach</li>
                  <li>• Automatically swap YT for PT via AMM when triggered</li>
                  <li>• Apply slippage protection and deadline constraints</li>
                  <li>• Charge {converterData.conversionFee}% conversion fee</li>
                </ul>
              </div>

              <Button
                onClick={handleConfigureConversion}
                className="w-full"
                disabled={!thresholdPrice || !maturityDate}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure Conversion
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deposit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Deposit YT Tokens
              </CardTitle>
              <CardDescription>Deposit YT tokens to be automatically converted when conditions are met</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="deposit-amount">YT Amount</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  placeholder="Enter amount to deposit"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Current balance: {converterData.ytBalance.toLocaleString()} YT
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Deposit Summary:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">YT to deposit:</span>
                    <span>{depositAmount || "0"} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated PT output:</span>
                    <span>{depositAmount ? (Number.parseFloat(depositAmount) * 0.95).toFixed(2) : "0"} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conversion fee:</span>
                    <span>
                      {depositAmount
                        ? ((Number.parseFloat(depositAmount) * converterData.conversionFee) / 100).toFixed(2)
                        : "0"}{" "}
                      tokens
                    </span>
                  </div>
                </div>
              </div>

              <Button onClick={handleDepositYT} className="w-full" disabled={!depositAmount || converterData.isPaused}>
                <Zap className="h-4 w-4 mr-2" />
                Deposit YT Tokens
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="execute" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Execute Conversion
              </CardTitle>
              <CardDescription>Manually trigger conversion if threshold conditions are met</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="min-pt-amount">Minimum PT Amount</Label>
                  <Input
                    id="min-pt-amount"
                    type="number"
                    placeholder="Minimum PT to receive"
                    value={minPtAmount}
                    onChange={(e) => setMinPtAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Slippage protection</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline (minutes)</Label>
                  <Input
                    id="deadline"
                    type="number"
                    placeholder="Transaction deadline"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Time limit for execution</p>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Execution Requirements:</h4>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${converterData.currentPrice >= converterData.userThresholdPrice ? "bg-green-500" : "bg-red-500"}`}
                    />
                    Price threshold reached (
                    {converterData.currentPrice >= converterData.userThresholdPrice ? "Met" : "Not met"})
                  </li>
                  <li className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${converterData.ytBalance > 0 ? "bg-green-500" : "bg-red-500"}`}
                    />
                    YT tokens available ({converterData.ytBalance > 0 ? "Available" : "None"})
                  </li>
                  <li className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${!converterData.conversionExecuted ? "bg-green-500" : "bg-red-500"}`}
                    />
                    Conversion not executed ({!converterData.conversionExecuted ? "Ready" : "Already executed"})
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleExecuteConversion}
                className="w-full"
                disabled={
                  !minPtAmount ||
                  !deadline ||
                  converterData.currentPrice < converterData.userThresholdPrice ||
                  converterData.conversionExecuted ||
                  converterData.ytBalance === 0
                }
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Execute Conversion
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversion History</CardTitle>
              <CardDescription>Your recent auto-conversion transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {converterData.conversionHistory.map((conversion, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{conversion.date}</p>
                      <p className="text-sm text-muted-foreground">
                        {conversion.ytAmount} YT → {conversion.ptAmount} PT
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${conversion.price.toFixed(4)}</p>
                      <p className="text-sm text-muted-foreground">Price</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
