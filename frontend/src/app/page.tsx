import HeroSection      from '@/components/home/HeroSection';
import StatsBar         from '@/components/home/StatsBar';
import FeaturesGrid     from '@/components/home/FeaturesGrid';
import PipelineSection  from '@/components/home/PipelineSection';
import CTASection       from '@/components/home/CTASection';

export default function Home() {
  return (
    <main>
      <HeroSection />
      <StatsBar />
      <FeaturesGrid />
      <PipelineSection />
      <CTASection />
    </main>
  );
}
