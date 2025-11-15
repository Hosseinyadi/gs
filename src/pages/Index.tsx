import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import SearchSection from "@/components/SearchSection";
import FeaturedAds from "@/components/FeaturedAds";
import FeaturedListingsLive from "@/components/FeaturedListingsLive";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import SEOHead from "@/components/SEOHead";

const Index = () => {
  return (
    <div className="min-h-screen">
      <SEOHead 
        title="گاراژ سنگین - بزرگترین مرکز ماشین‌آلات سنگین ایران"
        description="خرید، فروش و اجاره ماشین‌آلات سنگین با بهترین قیمت. بیل مکانیکی، لودر، بولدوزر، کرین، کمپرسی و قطعات یدکی اصل. تحویل سریع در سراسر کشور"
        keywords="گاراژ سنگین، ماشین آلات سنگین، بیل مکانیکی، لودر، بولدوزر، کرین، کمپرسی، اجاره ماشین آلات، فروش ماشین آلات، قطعات یدکی، garage sangin, heavy machinery iran"
        url="https://garagesangin.com/"
      />
      <Header />
      <main>
        <HeroSection />
        <SearchSection />
        <FeaturedListingsLive />
        <FeaturedAds />
        <HowItWorks />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
};

export default Index;