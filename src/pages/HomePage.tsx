import { Hero } from '../components/home/Hero'
import { HomeFooter } from '../components/home/HomeFooter'
import { HomeHeader } from '../components/home/HomeHeader'
import { HowItWorks } from '../components/home/HowItWorks'
import { ClosingCta } from '../components/home/ClosingCta'
import { Pathways } from '../components/home/Pathways'
import { TrustBand } from '../components/home/TrustBand'
import { WhatYoullLearn } from '../components/home/WhatYoullLearn'

// The public landing page. First-time visitors are routed here (see RootRedirect); it
// stays reachable after onboarding too. Composed of focused section components.
export function HomePage() {
  return (
    <div className="min-h-dvh bg-background">
      <HomeHeader />
      <main>
        <Hero />
        <WhatYoullLearn />
        <Pathways />
        <TrustBand />
        <HowItWorks />
        <ClosingCta />
      </main>
      <HomeFooter />
    </div>
  )
}
