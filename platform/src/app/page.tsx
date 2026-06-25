import { PlatformHeader } from "@/components/lobby/PlatformHeader"
import { VideoHero } from "@/components/lobby/VideoHero"
import { FeatureGrid } from "@/components/lobby/FeatureGrid"
import { EcosystemSection } from "@/components/lobby/EcosystemSection"
import { PricingSection } from "@/components/lobby/PricingSection"
import { PlatformFooter } from "@/components/lobby/PlatformFooter"
import { FinalCta } from "@/components/lobby/FinalCta"

export default function LobbyPage() {
  return (
    <div className="min-h-screen bg-white">
      <PlatformHeader />
      <main>
        <VideoHero />
        <FeatureGrid />
        <EcosystemSection />
        <PricingSection />
        <FinalCta />
      </main>
      <PlatformFooter />
    </div>
  )
}
