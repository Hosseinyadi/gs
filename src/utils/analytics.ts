import React from 'react';
// import ReactGA from 'react-ga4';

// Google Analytics Configuration
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // باید با ID واقعی جایگزین شود

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

class Analytics {
  private isInitialized = false;
  private isEnabled = false;

  // Initialize Google Analytics
  initialize() {
    if (typeof window === 'undefined') return;

    // Check if analytics cookies are allowed
    const cookieConsent = localStorage.getItem('cookie-consent');
    if (cookieConsent) {
      try {
        const preferences = JSON.parse(cookieConsent);
        this.isEnabled = preferences.analytics;
      } catch (error) {
        console.error('Error parsing cookie preferences:', error);
        this.isEnabled = false;
      }
    }

    if (this.isEnabled && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
      // ReactGA.initialize(GA_MEASUREMENT_ID, {
      //   testMode: process.env.NODE_ENV === 'development'
      // });
      this.isInitialized = true;
      console.log('Google Analytics initialized (mock)');
    }
  }

  // Track page views
  trackPageView(path: string, title?: string) {
    if (!this.isInitialized || !this.isEnabled) return;

    // ReactGA.send({
    //   hitType: 'pageview',
    //   page: path,
    //   title: title || document.title
    // });
    console.log('Page view tracked:', path);
  }

  // Track custom events
  trackEvent({ action, category, label, value }: AnalyticsEvent) {
    if (!this.isInitialized || !this.isEnabled) return;

    // ReactGA.event({
    //   action,
    //   category,
    //   label,
    //   value
    // });
    console.log('Event tracked:', { action, category, label, value });
  }

  // Track user interactions
  trackUserInteraction(action: string, element: string) {
    this.trackEvent({
      action,
      category: 'User Interaction',
      label: element
    });
  }

  // Track business events
  trackListingView(listingId: string, listingType: 'rent' | 'sale') {
    this.trackEvent({
      action: 'view_listing',
      category: 'Listings',
      label: `${listingType}_${listingId}`
    });
  }

  trackListingContact(listingId: string, contactMethod: 'phone' | 'message') {
    this.trackEvent({
      action: 'contact_seller',
      category: 'Listings',
      label: `${contactMethod}_${listingId}`
    });
  }

  trackSearch(query: string, filters?: any) {
    this.trackEvent({
      action: 'search',
      category: 'Search',
      label: query
    });
  }

  trackRegistration(method: 'otp' | 'password') {
    this.trackEvent({
      action: 'sign_up',
      category: 'Authentication',
      label: method
    });
  }

  trackLogin(method: 'otp' | 'password') {
    this.trackEvent({
      action: 'login',
      category: 'Authentication',
      label: method
    });
  }

  trackAdPost(category: string, type: 'rent' | 'sale') {
    this.trackEvent({
      action: 'post_ad',
      category: 'Listings',
      label: `${type}_${category}`
    });
  }

  trackPayment(amount: number, method: string, purpose: string) {
    this.trackEvent({
      action: 'purchase',
      category: 'Payment',
      label: `${method}_${purpose}`,
      value: amount
    });
  }

  // Track errors
  trackError(error: string, page: string) {
    this.trackEvent({
      action: 'error',
      category: 'Errors',
      label: `${page}: ${error}`
    });
  }

  // Enable/disable analytics based on cookie consent
  updateConsent(enabled: boolean) {
    this.isEnabled = enabled;
    
    if (enabled && !this.isInitialized) {
      this.initialize();
    }

    // Update gtag consent
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: enabled ? 'granted' : 'denied'
      });
    }
  }

  // Get analytics status
  getStatus() {
    return {
      initialized: this.isInitialized,
      enabled: this.isEnabled
    };
  }
}

// Create singleton instance
export const analytics = new Analytics();

// Initialize on import (if in browser)
if (typeof window !== 'undefined') {
  analytics.initialize();
}

export default analytics;

// Hook for React components
export const useAnalytics = () => {
  return analytics;
};

// Helper functions for easy import
export const trackPayment = (amount: number, method: string, purpose: string) => {
  analytics.trackPayment(amount, method, purpose);
};

export const trackListing = (listingId: string, listingType: 'rent' | 'sale') => {
  analytics.trackListingView(listingId, listingType);
};

export const trackSearch = (query: string, filters?: any) => {
  analytics.trackSearch(query, filters);
};

export const trackUserInteraction = (action: string, element: string) => {
  analytics.trackUserInteraction(action, element);
};

// Higher-order component for automatic page tracking
export function withAnalytics<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AnalyticsWrapper(props: P) {
    React.useEffect(() => {
      analytics.trackPageView(window.location.pathname);
    }, []);

    return React.createElement(WrappedComponent, props);
  };
}