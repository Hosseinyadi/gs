import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  locale?: string;
  siteName?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = "گاراژ سنگین - خرید، فروش و اجاره ماشین‌آلات سنگین در ایران",
  description = "بزرگترین مرکز خرید، فروش و اجاره ماشین‌آلات سنگین ایران. بیل مکانیکی، لودر، بولدوزر، کرین، کامیون و قطعات یدکی با بهترین قیمت و ضمانت معتبر در تهران، اصفهان، مشهد و سراسر کشور",
  keywords = "گاراژ سنگین، ماشین آلات سنگین ایران، بیل مکانیکی، لودر، بولدوزر، کرین، کامیون، اجاره ماشین آلات، فروش ماشین آلات، قطعات یدکی، تهران، اصفهان، مشهد، شیراز، تبریز، کرج، قم، اهواز، کرمان، رشت",
  image = "/garage-sangin-logo.jpg",
  url = "https://garagesangin.com/",
  type = "website",
  author = "گاراژ سنگین",
  locale = "fa_IR",
  siteName = "گاراژ سنگین"
}) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', author || 'گاراژ سنگین');
    updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    updateMetaTag('language', 'Persian');
    updateMetaTag('geo.region', 'IR');
    updateMetaTag('geo.country', 'Iran');
    updateMetaTag('geo.placename', 'Iran');

    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:locale', locale || 'fa_IR', true);
    updateMetaTag('og:site_name', siteName || 'گاراژ سنگین', true);

    // Twitter tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:site', '@garagesangin');

    // Additional Iranian SEO tags
    updateMetaTag('DC.title', title);
    updateMetaTag('DC.description', description);
    updateMetaTag('DC.language', 'fa');
    updateMetaTag('DC.coverage', 'Iran');

    // Schema.org structured data for Iranian business
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": siteName || "گاراژ سنگین",
      "description": description,
      "url": url,
      "logo": image,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "IR",
        "addressRegion": "تهران",
        "addressLocality": "تهران"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "35.6892",
        "longitude": "51.3890"
      },
      "telephone": "+98-21-12345678",
      "priceRange": "$$",
      "openingHours": "Mo-Sa 08:00-18:00",
      "paymentAccepted": "Cash, Credit Card, Bank Transfer",
      "currenciesAccepted": "IRR",
      "areaServed": {
        "@type": "Country",
        "name": "Iran"
      },
      "serviceArea": {
        "@type": "Country",
        "name": "Iran"
      }
    };

    // Add or update structured data
    let structuredDataScript = document.querySelector('script[type="application/ld+json"]');
    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script');
      structuredDataScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(structuredDataScript);
    }
    structuredDataScript.textContent = JSON.stringify(structuredData);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    // Alternate language tags for Persian
    let alternatePersian = document.querySelector('link[rel="alternate"][hreflang="fa"]') as HTMLLinkElement;
    if (!alternatePersian) {
      alternatePersian = document.createElement('link');
      alternatePersian.setAttribute('rel', 'alternate');
      alternatePersian.setAttribute('hreflang', 'fa');
      document.head.appendChild(alternatePersian);
    }
    alternatePersian.setAttribute('href', url);

  }, [title, description, keywords, image, url, type, author, locale, siteName]);

  return null;
};

export default SEOHead;