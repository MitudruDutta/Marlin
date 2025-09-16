"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Copy, Send, Clock, Coins } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function TokenManagement() {
  const [ptTransferAmount, setPtTransferAmount] = useState("")
  const [ptTransferTo, setPtTransferTo] = useState("")
  const [ytTransferAmount, setYtTransferAmount] = useState("")
  const [ytTransferTo, setYtTransferTo] = useState("")
  const [burnAmount, setBurnAmount] = useState("")
  const { toast } = useToast()

  // Mock data - in real app this would come from contract calls
  const tokenData = {
    pt: {
      name: "Principal Token",
      symbol: "PT-USDC-2024",
      balance: 1500,
      maturity: new Date("2024-12-31").getTime(),
      totalSupply: 100000,
      decimals: 18,
    },
    yt: {
      name: "Yield Token",
      symbol: "YT-USDC-2024",
      balance: 1500,
      maturity: new Date("2024-12-31").getTime(),
      totalSupply: 100000,
      decimals: 18,
      isAccruing: true,
    },
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "Address copied successfully",
    })
  }

  const handlePTTransfer = () => {
    console.log("PT Transfer:", { amount: ptTransferAmount, to: ptTransferTo })
    toast({
      title: "Transfer initiated",
      description: `Transferring ${ptTransferAmount} PT tokens`,
    })
  }

  const handleYTTransfer = () => {
    console.log("YT Transfer:", { amount: ytTransferAmount, to: ytTransferTo })
    toast({
      title: "Transfer initiated",
      description: `Transferring ${ytTransferAmount} YT tokens`,
    })
  }

  const handleBurn = (tokenType: "pt" | "yt") => {
    console.log(`Burning ${tokenType.toUpperCase()}:`, burnAmount)
    toast({
      title: "Burn initiated",
      description: `Burning ${burnAmount} ${tokenType.toUpperCase()} tokens`,
    })
  }

  const formatTimeToMaturity = (maturity: number) => {
    const now = Date.now()
    const timeLeft = maturity - now
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
    return days > 0 ? `${days} days` : "Matured"
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Principal Token (PT)
            </CardTitle>
            <CardDescription>Represents claim to underlying assets at maturity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Balance</span>
                <span className="font-medium">
                  {tokenData.pt.balance.toLocaleString()} {tokenData.pt.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Maturity</span>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTimeToMaturity(tokenData.pt.maturity)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Supply</span>
                <span className="text-sm">{tokenData.pt.totalSupply.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-chart-2" />
              Yield Token (YT)
            </CardTitle>
            <CardDescription>Captures future yield until maturity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Balance</span>
                <span className="font-medium">
                  {tokenData.yt.balance.toLocaleString()} {tokenData.yt.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Yield Status</span>
                <Badge variant={tokenData.yt.isAccruing ? "default" : "secondary"}>
                  {tokenData.yt.isAccruing ? "Accruing" : "Stopped"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Maturity</span>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTimeToMaturity(tokenData.yt.maturity)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transfer" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transfer">Transfer Tokens</TabsTrigger>
          <TabsTrigger value="burn">Burn Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="transfer" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Transfer PT Tokens</CardTitle>
                <CardDescription>Send Principal Tokens to another address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pt-recipient">Recipient Address</Label>
                  <div className="flex gap-2">
                    <Input
                      id="pt-recipient"
                      placeholder="0x..."
                      value={ptTransferTo}
                      onChange={(e) => setPtTransferTo(e.target.value)}
                    />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(ptTransferTo)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pt-amount">Amount</Label>
                  <Input
                    id="pt-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={ptTransferAmount}
                    onChange={(e) => setPtTransferAmount(e.target.value)}
                    max={tokenData.pt.balance}
                  />
                  <p className="text-xs text-muted-foreground">Max: {tokenData.pt.balance.toLocaleString()} PT</p>
                </div>
                <Button onClick={handlePTTransfer} className="w-full" disabled={!ptTransferAmount || !ptTransferTo}>
                  <Send className="h-4 w-4 mr-2" />
                  Transfer PT
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transfer YT Tokens</CardTitle>
                <CardDescription>Send Yield Tokens to another address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="yt-recipient">Recipient Address</Label>
                  <div className="flex gap-2">
                    <Input
                      id="yt-recipient"
                      placeholder="0x..."
                      value={ytTransferTo}
                      onChange={(e) => setYtTransferTo(e.target.value)}
                    />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(ytTransferTo)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yt-amount">Amount</Label>
                  <Input
                    id="yt-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={ytTransferAmount}
                    onChange={(e) => setYtTransferAmount(e.target.value)}
                    max={tokenData.yt.balance}
                  />
                  <p className="text-xs text-muted-foreground">Max: {tokenData.yt.balance.toLocaleString()} YT</p>
                </div>
                <Button onClick={handleYTTransfer} className="w-full" disabled={!ytTransferAmount || !ytTransferTo}>
                  <Send className="h-4 w-4 mr-2" />
                  Transfer YT
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="burn" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Burn Tokens</CardTitle>
              <CardDescription>Permanently destroy tokens from your balance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">Burn PT Tokens</h4>
                  <div className="space-y-2">
                    <Label htmlFor="burn-pt-amount">Amount to Burn</Label>
                    <Input
                      id="burn-pt-amount"
                      type="number"
                      placeholder="Enter amount"
                      value={burnAmount}
                      onChange={(e) => setBurnAmount(e.target.value)}
                      max={tokenData.pt.balance}
                    />
                    <p className="text-xs text-muted-foreground">
                      Available: {tokenData.pt.balance.toLocaleString()} PT
                    </p>
                  </div>
                  <Button
                    onClick={() => handleBurn("pt")}
                    variant="destructive"
                    className="w-full"
                    disabled={!burnAmount}
                  >
                    Burn PT Tokens
                  </Button>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Burn YT Tokens</h4>
                  <div className="space-y-2">
                    <Label htmlFor="burn-yt-amount">Amount to Burn</Label>
                    <Input
                      id="burn-yt-amount"
                      type="number"
                      placeholder="Enter amount"
                      value={burnAmount}
                      onChange={(e) => setBurnAmount(e.target.value)}
                      max={tokenData.yt.balance}
                    />
                    <p className="text-xs text-muted-foreground">
                      Available: {tokenData.yt.balance.toLocaleString()} YT
                    </p>
                  </div>
                  <Button
                    onClick={() => handleBurn("yt")}
                    variant="destructive"
                    className="w-full"
                    disabled={!burnAmount}
                  >
                    Burn YT Tokens
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Important Notes</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Burned tokens cannot be recovered</li>
                  <li>• This action will permanently reduce the total supply</li>
                  <li>• Make sure you understand the implications before proceeding</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
