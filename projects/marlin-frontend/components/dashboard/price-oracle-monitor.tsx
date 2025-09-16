"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { AlertTriangle, Shield, TrendingUp, Users, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function PriceOracleMonitor() {
  const [newPrice, setNewPrice] = useState("")
  const [confidence, setConfidence] = useState("")
  const [threshold, setThreshold] = useState("")
  const [updaterAddress, setUpdaterAddress] = useState("")
  const [currentTime, setCurrentTime] = useState(Date.now())
  const { toast } = useToast()

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Mock data - in real app this would come from contract calls
  const oracleData = {
    currentPrice: 1.2345,
    priceTimestamp: Date.now() - 300000, // 5 minutes ago
    priceConfidence: 95,
    lastUpdater: "0x1234...5678",
    thresholdPrice: 1.5,
    thresholdActive: true,
    circuitBreakerActive: false,
    isPaused: false,
    updaterCount: 3,
    totalUpdates: 1247,
    priceHistory: [
      { time: "00:00", price: 1.21, confidence: 92 },
      { time: "04:00", price: 1.225, confidence: 94 },
      { time: "08:00", price: 1.218, confidence: 96 },
      { time: "12:00", price: 1.23, confidence: 93 },
      { time: "16:00", price: 1.2345, confidence: 95 },
      { time: "20:00", price: 1.24, confidence: 97 },
    ],
    authorizedUpdaters: [
      { address: "0x1234...5678", isActive: true, lastUpdate: Date.now() - 300000 },
      { address: "0x9abc...def0", isActive: true, lastUpdate: Date.now() - 600000 },
      { address: "0x5678...9abc", isActive: false, lastUpdate: Date.now() - 86400000 },
    ],
  }

  const handleUpdatePrice = () => {
    if (!newPrice || !confidence) return
    console.log("Update price:", { price: newPrice, confidence })
    toast({
      title: "Price update submitted",
      description: `New price: $${newPrice} with ${confidence}% confidence`,
    })
  }

  const handleSetThreshold = () => {
    if (!threshold) return
    console.log("Set threshold:", threshold)
    toast({
      title: "Threshold updated",
      description: `New threshold set to $${threshold}`,
    })
  }

  const handleAddUpdater = () => {
    if (!updaterAddress) return
    console.log("Add updater:", updaterAddress)
    toast({
      title: "Updater added",
      description: `Added ${updaterAddress} as price updater`,
    })
  }

  const handleCircuitBreaker = () => {
    console.log("Toggle circuit breaker")
    toast({
      title: "Circuit breaker toggled",
      description: oracleData.circuitBreakerActive ? "Circuit breaker deactivated" : "Circuit breaker activated",
    })
  }

  const getPriceStatus = () => {
    const staleness = currentTime - oracleData.priceTimestamp
    const staleThreshold = 3600000 // 1 hour

    if (oracleData.circuitBreakerActive) return { status: "Circuit Breaker Active", variant: "destructive" as const }
    if (staleness > staleThreshold) return { status: "Stale", variant: "destructive" as const }
    if (oracleData.priceConfidence < 90) return { status: "Low Confidence", variant: "secondary" as const }
    return { status: "Healthy", variant: "default" as const }
  }

  const formatTimestamp = (timestamp: number) => {
    const diff = currentTime - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m ago`
    return `${minutes}m ago`
  }

  const priceStatus = getPriceStatus()

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Price</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${oracleData.currentPrice.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">Updated {formatTimestamp(oracleData.priceTimestamp)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confidence</CardTitle>
            <Badge variant={oracleData.priceConfidence >= 90 ? "default" : "secondary"}>
              {oracleData.priceConfidence}%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{oracleData.priceConfidence}%</div>
            <p className="text-xs text-muted-foreground">Price reliability</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Badge variant={priceStatus.variant}>{priceStatus.status}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{priceStatus.status}</div>
            <p className="text-xs text-muted-foreground">Oracle health</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Updaters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{oracleData.updaterCount}</div>
            <p className="text-xs text-muted-foreground">Authorized sources</p>
          </CardContent>
        </Card>
      </div>

      {oracleData.circuitBreakerActive && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Circuit breaker is active - price updates are halted</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
          <CardDescription>24-hour price movement with confidence levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={oracleData.priceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={["dataMin - 0.01", "dataMax + 0.01"]} />
                <Tooltip
                  formatter={(value: any, name: string) => [
                    name === "price" ? `$${value.toFixed(4)}` : `${value}%`,
                    name === "price" ? "Price" : "Confidence",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="update" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="update">Update Price</TabsTrigger>
          <TabsTrigger value="manage">Manage Oracle</TabsTrigger>
          <TabsTrigger value="updaters">Updaters</TabsTrigger>
        </TabsList>

        <TabsContent value="update" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Submit Price Update
              </CardTitle>
              <CardDescription>Update the oracle price with validation (Authorized updaters only)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-price">New Price</Label>
                  <Input
                    id="new-price"
                    type="number"
                    step="0.0001"
                    placeholder="Enter price"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confidence">Confidence Level (%)</Label>
                  <Input
                    id="confidence"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Enter confidence"
                    value={confidence}
                    onChange={(e) => setConfidence(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Validation Checks</h4>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Price deviation within acceptable range
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Confidence level above minimum threshold
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Circuit breaker not active
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleUpdatePrice}
                className="w-full"
                disabled={!newPrice || !confidence || oracleData.circuitBreakerActive}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Update Price
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Set Price Threshold
                </CardTitle>
                <CardDescription>Configure price monitoring threshold</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="threshold">Threshold Price</Label>
                  <Input
                    id="threshold"
                    type="number"
                    step="0.0001"
                    placeholder="Enter threshold"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Current: ${oracleData.thresholdPrice.toFixed(4)}</p>
                </div>

                <Button onClick={handleSetThreshold} className="w-full" disabled={!threshold}>
                  Set Threshold
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Circuit Breaker
                </CardTitle>
                <CardDescription>Emergency shutdown control</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Circuit Breaker Status</p>
                    <p className="text-sm text-muted-foreground">
                      {oracleData.circuitBreakerActive ? "Active - Updates halted" : "Inactive - Normal operation"}
                    </p>
                  </div>
                  <Badge variant={oracleData.circuitBreakerActive ? "destructive" : "default"}>
                    {oracleData.circuitBreakerActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <Button
                  onClick={handleCircuitBreaker}
                  variant={oracleData.circuitBreakerActive ? "default" : "destructive"}
                  className="w-full"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {oracleData.circuitBreakerActive ? "Deactivate" : "Activate"} Circuit Breaker
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Oracle Statistics</CardTitle>
              <CardDescription>Performance metrics and activity overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{oracleData.totalUpdates.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Updates</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-chart-2">{formatTimestamp(oracleData.priceTimestamp)}</p>
                  <p className="text-sm text-muted-foreground">Last Update</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-chart-3">{oracleData.priceConfidence}%</p>
                  <p className="text-sm text-muted-foreground">Avg Confidence</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-chart-4">99.8%</p>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="updaters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Add Price Updater
              </CardTitle>
              <CardDescription>Authorize new addresses to update oracle prices (Admin only)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="updater-address">Updater Address</Label>
                <Input
                  id="updater-address"
                  placeholder="0x..."
                  value={updaterAddress}
                  onChange={(e) => setUpdaterAddress(e.target.value)}
                />
              </div>

              <Button onClick={handleAddUpdater} className="w-full" disabled={!updaterAddress}>
                <Users className="h-4 w-4 mr-2" />
                Add Updater
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authorized Updaters</CardTitle>
              <CardDescription>Current list of addresses authorized to update prices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {oracleData.authorizedUpdaters.map((updater, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-mono text-sm">{updater.address}</p>
                      <p className="text-xs text-muted-foreground">
                        Last update: {formatTimestamp(updater.lastUpdate)}
                      </p>
                    </div>
                    <Badge variant={updater.isActive ? "default" : "secondary"}>
                      {updater.isActive ? "Active" : "Inactive"}
                    </Badge>
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
