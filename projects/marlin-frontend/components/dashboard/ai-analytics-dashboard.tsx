"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  Eye, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  BarChart3,
  PieChart,
  Settings
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAIAgent } from "@/hooks/useAIAgent"

export function AIAnalyticsDashboard() {
  const [autoOptimize, setAutoOptimize] = useState(false)
  const [riskProfile, setRiskProfile] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate')
  const [investmentAmount, setInvestmentAmount] = useState("")
  const [maturityMonths, setMaturityMonths] = useState<3 | 6 | 9 | 12>(6)
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const { toast } = useToast()

  const {
    isConnected,
    isLoading,
    error,
    lastUpdate,
    contractStatus,
    latestOptimization,
    latestCoinData,
    isHealthy,
    isModelReady,
    isAlgorandReady,
    connectedContracts,
    totalContracts,
    getOptimization,
    reconnect,
  } = useAIAgent()

  // Auto-optimization when enabled
  useEffect(() => {
    if (autoOptimize && investmentAmount && isHealthy) {
      const interval = setInterval(async () => {
        try {
          await getOptimization({
            coin_id: 'algorand',
            risk_profile: riskProfile,
            maturity_months: maturityMonths,
            amount_algo: parseFloat(investmentAmount)
          })
          
          if (alertsEnabled) {
            toast({
              title: "Auto-optimization complete",
              description: "Investment recommendations have been updated",
            })
          }
        } catch (error) {
          console.error('Auto-optimization failed:', error)
        }
      }, 60000) // Every minute
      
      return () => clearInterval(interval)
    }
  }, [autoOptimize, investmentAmount, riskProfile, maturityMonths, isHealthy, getOptimization, alertsEnabled, toast])

  const handleManualOptimize = async () => {
    if (!investmentAmount) {
      toast({
        title: "Invalid input",
        description: "Please enter an investment amount",
        variant: "destructive"
      })
      return
    }

    try {
      await getOptimization({
        coin_id: 'algorand',
        risk_profile: riskProfile,
        maturity_months: maturityMonths,
        amount_algo: parseFloat(investmentAmount)
      })
      
      toast({
        title: "Optimization complete",
        description: "New recommendations generated successfully",
      })
    } catch (error) {
      toast({
        title: "Optimization failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      })
    }
  }

  const getConnectionStatus = () => {
    if (isLoading) return { icon: Clock, color: "text-yellow-500", text: "Connecting..." }
    if (!isConnected) return { icon: XCircle, color: "text-red-500", text: "Disconnected" }
    if (!isHealthy) return { icon: AlertTriangle, color: "text-orange-500", text: "Partial Connection" }
    return { icon: CheckCircle, color: "text-green-500", text: "Connected" }
  }

  const connectionStatus = getConnectionStatus()

  const getPriceChangeColor = (change?: number) => {
    if (!change) return "text-muted-foreground"
    return change >= 0 ? "text-green-500" : "text-red-500"
  }

  const getPriceChangeIcon = (change?: number) => {
    if (!change) return Activity
    return change >= 0 ? TrendingUp : TrendingDown
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className={`border-l-4 ${isHealthy ? 'border-l-green-500' : 'border-l-red-500'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">AI Agent Status</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <connectionStatus.icon className={`h-4 w-4 ${connectionStatus.color}`} />
              <span className={`text-sm font-medium ${connectionStatus.color}`}>
                {connectionStatus.text}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">ML Model</span>
              <Badge variant={isModelReady ? "default" : "destructive"}>
                {isModelReady ? "Ready" : "Not Ready"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Algorand</span>
              <Badge variant={isAlgorandReady ? "default" : "destructive"}>
                {isAlgorandReady ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Contracts</span>
              <Badge variant={connectedContracts > 0 ? "default" : "secondary"}>
                {connectedContracts}/{totalContracts}
              </Badge>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
                <Button size="sm" variant="outline" onClick={reconnect} className="ml-auto">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reconnect
                </Button>
              </div>
            </div>
          )}
          
          {lastUpdate && (
            <p className="text-xs text-muted-foreground mt-2">
              Last update: {new Date(lastUpdate).toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Real-time Data Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ALGO Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${latestCoinData?.current_price?.toFixed(4) || '--'}
            </div>
            {latestCoinData?.price_change_percentage_24h_in_currency && (
              <div className={`flex items-center gap-1 text-xs ${getPriceChangeColor(latestCoinData.price_change_percentage_24h_in_currency)}`}>
                {(() => {
                  const Icon = getPriceChangeIcon(latestCoinData.price_change_percentage_24h_in_currency)
                  return <Icon className="h-3 w-3" />
                })()}
                {latestCoinData.price_change_percentage_24h_in_currency.toFixed(2)}% (24h)
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Prediction</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${latestOptimization?.prediction?.predicted_next_price?.toFixed(4) || '--'}
            </div>
            {latestOptimization?.prediction?.trend_estimate && (
              <div className={`flex items-center gap-1 text-xs ${getPriceChangeColor(latestOptimization.prediction.trend_estimate)}`}>
                {(() => {
                  const Icon = getPriceChangeIcon(latestOptimization.prediction.trend_estimate)
                  return <Icon className="h-3 w-3" />
                })()}
                {(latestOptimization.prediction.trend_estimate * 100).toFixed(2)}% trend
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PT/YT Split</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {latestOptimization?.recommended_split ? 
                `${Math.round(latestOptimization.recommended_split.PT * 100)}/${Math.round(latestOptimization.recommended_split.YT * 100)}` 
                : '--/--'
              }
            </div>
            <p className="text-xs text-muted-foreground">PT/YT ratio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto Status</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${autoOptimize ? 'text-green-500' : 'text-muted-foreground'}`}>
              {autoOptimize ? 'ACTIVE' : 'MANUAL'}
            </div>
            <p className="text-xs text-muted-foreground">
              {autoOptimize ? 'Auto-optimizing' : 'Manual control'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Control Panel */}
      <Tabs defaultValue="optimize" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="optimize">AI Optimization</TabsTrigger>
          <TabsTrigger value="monitor">Real-time Monitor</TabsTrigger>
          <TabsTrigger value="settings">Automation Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="optimize" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Investment Optimization
              </CardTitle>
              <CardDescription>
                Get real-time AI recommendations for optimal PT/YT allocation based on market conditions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="investment-amount">Investment Amount (ALGO)</Label>
                  <Input
                    id="investment-amount"
                    type="number"
                    placeholder="Enter ALGO amount"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Risk Profile</Label>
                  <Select value={riskProfile} onValueChange={(value: 'conservative' | 'moderate' | 'aggressive') => setRiskProfile(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Maturity Period</Label>
                  <Select value={maturityMonths.toString()} onValueChange={(value) => setMaturityMonths(parseInt(value) as 3 | 6 | 9 | 12)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 months</SelectItem>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="9">9 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Automation</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-optimize"
                      checked={autoOptimize}
                      onCheckedChange={setAutoOptimize}
                      disabled={!isHealthy}
                    />
                    <Label htmlFor="auto-optimize">Enable auto-optimization</Label>
                  </div>
                </div>
              </div>

              {latestOptimization && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Latest AI Recommendation</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium">Recommended Split:</p>
                      <p className="text-lg">
                        <span className="text-blue-600">{Math.round(latestOptimization.recommended_split.PT * 100)}% PT</span>
                        {" / "}
                        <span className="text-green-600">{Math.round(latestOptimization.recommended_split.YT * 100)}% YT</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Price Prediction:</p>
                      <p className="text-lg">
                        ${latestOptimization.prediction.predicted_next_price.toFixed(4)}
                        <span className={`ml-2 text-sm ${getPriceChangeColor(latestOptimization.prediction.trend_estimate)}`}>
                          ({latestOptimization.prediction.trend_estimate > 0 ? '+' : ''}
                          {(latestOptimization.prediction.trend_estimate * 100).toFixed(2)}%)
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleManualOptimize}
                className="w-full"
                disabled={!investmentAmount || !isHealthy}
              >
                <Brain className="h-4 w-4 mr-2" />
                Get AI Recommendation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Real-time Contract Monitoring
              </CardTitle>
              <CardDescription>Live monitoring of smart contract states and activities</CardDescription>
            </CardHeader>
            <CardContent>
              {contractStatus ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Network: {contractStatus.network}</span>
                    <Badge variant="outline">
                      {contractStatus.connected_contracts}/{contractStatus.total_contracts} Connected
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid gap-2">
                    {Object.entries(contractStatus.contracts).map(([name, info]: [string, Record<string, unknown>]) => (
                      <div key={name} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm font-medium capitalize">{name.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          {info.app_id && (
                            <Badge variant="secondary" className="text-xs">
                              ID: {info.app_id}
                            </Badge>
                          )}
                          <Badge variant={info.status === 'active' ? 'default' : 'destructive'}>
                            {info.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No contract data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Automation Settings
              </CardTitle>
              <CardDescription>Configure automated analysis and alert preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-optimize-setting">Auto-optimization</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically get new recommendations every minute
                    </p>
                  </div>
                  <Switch
                    id="auto-optimize-setting"
                    checked={autoOptimize}
                    onCheckedChange={setAutoOptimize}
                    disabled={!isHealthy}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="alerts-setting">Smart Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications for important events and recommendations
                    </p>
                  </div>
                  <Switch
                    id="alerts-setting"
                    checked={alertsEnabled}
                    onCheckedChange={setAlertsEnabled}
                  />
                </div>

                <Separator />

                <div>
                  <Label>Health Monitoring</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Connection Status</span>
                      <Progress 
                        value={isConnected ? 100 : 0} 
                        className="w-32"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">AI Model Health</span>
                      <Progress 
                        value={isModelReady ? 100 : 0} 
                        className="w-32"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Algorand Connection</span>
                      <Progress 
                        value={isAlgorandReady ? 100 : 0} 
                        className="w-32"
                      />
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
