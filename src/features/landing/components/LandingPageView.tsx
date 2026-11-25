import React from 'react';
import { LandingHeader } from './LandingHeader';
import { LandingHeroSection } from './LandingHeroSection';
import { FeatureBentoSection } from './FeatureBentoSection';
import { CommandPaletteSection } from './CommandPaletteSection';
import { HowItWorksSection } from './HowItWorksSection';
import { PricingSection } from './PricingSection';
import { FaqSection } from './FaqSection';
import { LandingFooter } from './LandingFooter';

export const LandingPageView: React.FC = () => {
  return (
    <div className="landing-light min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-foreground font-sans antialiased">
      <LandingHeader />

      <main>
        <LandingHeroSection />
        <FeatureBentoSection />
        <CommandPaletteSection />
        <HowItWorksSection />
        <PricingSection />
        <FaqSection />
      </main>

      <LandingFooter />
    </div>
  );
};
