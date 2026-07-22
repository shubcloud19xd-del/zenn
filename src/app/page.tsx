"use client";
import HeroSection from "@/components/HeroSection";
import LandingPageNavbar from "../components/LandingPageNavbar";
import { FeaturesSection } from "@/components/FeaturesSection";
import CTAdarkSection from "@/components/CTAdarkSection";
import Footer from "@/components/Footer";
import { useLenis } from "@/lib/useLenis";

export default function Home() {
  useLenis();
  return (
    <>
      <div className="w-full min-h-screen flex flex-col bg-fixed bg-cover bg-right dark:bg-bottom bg-landing-bg dark:bg-landing-bg-dark">
        {/* Top Section with Black Gradient */}
        <div className="dark:bg-gradient-to-b dark:from-black dark:via-black dark:to-transparent">
          {/* Sticky Navbar */}
          <div className="top-0 sticky z-50 w-full bg-white/10 dark:bg-black/50 backdrop-blur-md">
            <LandingPageNavbar />
          </div>

          {/* Hero Section */}
          <div className="flex flex-col px-6 md:px-12 lg:px-20 xl:px-32">
            <HeroSection />
          </div>
        </div>

        <div className="relative flex flex-col items-center justify-center px-6 md:px-12 lg:px-20 xl:px-32 pt-12 md:pt-20">
          {/* Features and CTA Section (Testimonials removed to avoid fake reviews) */}
          <FeaturesSection />
          <CTAdarkSection />
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}