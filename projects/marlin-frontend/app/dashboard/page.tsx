import { StakingDashboard } from "@/components/dashboard/staking-dashboard"
import { TokenManagement } from "@/components/dashboard/token-management"
import { YieldTokenizationDashboard as AMMInterface } from "@/components/dashboard/amm-interface"
import { YieldTokenizationDashboard } from "@/components/dashboard/yield-tokenization-dashboard"
import { PriceOracleMonitor } from "@/components/dashboard/price-oracle-monitor"
import { AutoConverterInterface } from "@/components/dashboard/auto-converter-interface"
import { WrapperInterface } from "@/components/dashboard/wrapper-interface"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground">DeFi Yield Protocol Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your yield tokenization positions and strategies</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="staking" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="staking">Staking</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="amm">AMM</TabsTrigger>
            <TabsTrigger value="tokenization">Tokenization</TabsTrigger>
            <TabsTrigger value="oracle">Oracle</TabsTrigger>
            <TabsTrigger value="converter">Converter</TabsTrigger>
            <TabsTrigger value="wrapper">Wrapper</TabsTrigger>
          </TabsList>

          <TabsContent value="staking">
            <StakingDashboard />
          </TabsContent>

          <TabsContent value="tokens">
            <TokenManagement />
          </TabsContent>

          <TabsContent value="amm">
            <AMMInterface />
          </TabsContent>

          <TabsContent value="tokenization">
            <YieldTokenizationDashboard />
          </TabsContent>

          <TabsContent value="oracle">
            <PriceOracleMonitor />
          </TabsContent>

          <TabsContent value="converter">
            <AutoConverterInterface />
          </TabsContent>

          <TabsContent value="wrapper">
            <WrapperInterface />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
