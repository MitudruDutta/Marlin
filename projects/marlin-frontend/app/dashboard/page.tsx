import { EnhancedStakingDashboard } from "@/components/dashboard/enhanced-staking-dashboard"
import { TokenManagement } from "@/components/dashboard/token-management"
import { AMMInterface } from "@/components/dashboard/amm-interface"
import { YieldTokenizationDashboard } from "@/components/dashboard/yield-tokenization-dashboard"
import { PriceOracleMonitor } from "@/components/dashboard/price-oracle-monitor"
import { AutoConverterInterface } from "@/components/dashboard/auto-converter-interface"
import { WrapperInterface } from "@/components/dashboard/wrapper-interface"
import { AIAnalyticsDashboard } from "@/components/dashboard/ai-analytics-dashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <div className="flex items-center space-x-4">
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="ai-analytics" className="space-y-6">
          <div className="overflow-x-auto scrollbar-hide">
            <TabsList className="inline-flex w-full h-auto p-1 justify-between">
              <TabsTrigger value="ai-analytics" className="whitespace-nowrap px-3 py-2 text-sm flex-1">AI Analytics</TabsTrigger>
              <TabsTrigger value="staking" className="whitespace-nowrap px-3 py-2 text-sm flex-1">Staking</TabsTrigger>
              <TabsTrigger value="tokens" className="whitespace-nowrap px-3 py-2 text-sm flex-1">Tokens</TabsTrigger>
              <TabsTrigger value="amm" className="whitespace-nowrap px-3 py-2 text-sm flex-1">AMM</TabsTrigger>
              <TabsTrigger value="tokenization" className="whitespace-nowrap px-3 py-2 text-sm flex-1">Tokenization</TabsTrigger>
              <TabsTrigger value="oracle" className="whitespace-nowrap px-3 py-2 text-sm flex-1">Oracle</TabsTrigger>
              <TabsTrigger value="converter" className="whitespace-nowrap px-3 py-2 text-sm flex-1">Converter</TabsTrigger>
              <TabsTrigger value="wrapper" className="whitespace-nowrap px-3 py-2 text-sm flex-1">Wrapper</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="ai-analytics">
            <AIAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="staking">
            <EnhancedStakingDashboard />
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
