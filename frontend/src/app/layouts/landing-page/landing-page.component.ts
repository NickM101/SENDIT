import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';

// Define interfaces for type safety
interface PricingTier {
  name: string;
  weight: string;
  price: number;
  description: string;
  color: string;
}

interface Feature {
  title: string;
  description: string;
  color: string;
}

interface User {
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
}

interface QuoteForm {
  fromLocation: string;
  toLocation: string;
  weightCategory: string;
  serviceType: string;
  packageType: string;
}

interface CalculatedQuote {
  total: number;
  estimatedDelivery: string;
  basePrice: number;
  surcharge: number;
}

interface TrackingResult {
  trackingNumber: string;
  status: string;
  from: string;
  to: string;
  estimatedDelivery: string;
}

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
}

interface Service {
  name: string;
  description?: string;
}

@Component({
  selector: 'app-landing-page',
  standalone: true,
  templateUrl: './landing-page.component.html',
  imports: [SharedModule],
})
export class LandingPageComponent implements OnInit {
  // Authentication state
  isAuthenticated = false;
  isDropdownOpen = false;
  isMobileMenuOpen = false;
  isDarkMode = false;

  // User data
  user: User = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatarUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
    role: 'Premium User',
  };

  // Quote form data
  quoteForm: QuoteForm = {
    fromLocation: '',
    toLocation: '',
    weightCategory: '',
    serviceType: 'standard',
    packageType: 'document',
  };

  // Quote result
  calculatedQuote: CalculatedQuote | null = null;

  // Tracking
  trackingNumber = '';
  trackingResult: TrackingResult | null = null;

  // Pricing tiers data
  pricingTiers: PricingTier[] = [
    {
      name: 'Light',
      weight: '< 1kg',
      price: 15,
      description: 'Perfect for documents and small items',
      color: 'from-blue-500 to-blue-600',
    },
    {
      name: 'Medium',
      weight: '1-5kg',
      price: 25,
      description: 'Great for books, electronics, and gifts',
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      name: 'Heavy',
      weight: '5-20kg',
      price: 45,
      description: 'Ideal for larger packages and multiple items',
      color: 'from-purple-500 to-purple-600',
    },
    {
      name: 'Extra Heavy',
      weight: '20kg+',
      price: 75,
      description: 'For bulk shipments and heavy goods',
      color: 'from-pink-500 to-pink-600',
    },
  ];

  // Features data
  features: Feature[] = [
    {
      title: 'Fast Delivery',
      description:
        'Same-day and next-day delivery options available for urgent packages.',
      color: 'text-yellow-500',
    },
    {
      title: 'Secure Handling',
      description:
        'Your package is safe with us, handled with care and tracked throughout the journey.',
      color: 'text-green-500',
    },
    {
      title: 'Real-time Tracking',
      description:
        'Monitor your package movement and delivery status in real-time with GPS accuracy.',
      color: 'text-blue-500',
    },
  ];

  // Services data
  services: Service[] = [
    { name: 'Standard Delivery', description: '3-5 business days' },
    { name: 'Express Delivery', description: '1-2 business days' },
    { name: 'Same Day Delivery', description: 'Within 24 hours' },
    { name: 'International Shipping', description: 'Worldwide delivery' },
  ];

  // Testimonials data
  testimonials: Testimonial[] = [
    {
      name: 'Sarah Johnson',
      role: 'Small Business Owner',
      content:
        'SendIT has revolutionized how I ship products to my customers. Fast, reliable, and affordable!',
      rating: 5,
      avatar:
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop&crop=face',
    },
    {
      name: 'Michael Chen',
      role: 'E-commerce Manager',
      content:
        'The real-time tracking and professional service make SendIT our go-to courier service.',
      rating: 5,
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Freelancer',
      content:
        'Quick quotes, transparent pricing, and excellent customer service. Highly recommended!',
      rating: 5,
      avatar:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face',
    },
  ];

  constructor() {}

  ngOnInit(): void {
    // Initialize component
    this.checkAuthenticationStatus();
    this.loadUserPreferences();
  }

  // Authentication methods
  signIn(): void {
    this.isAuthenticated = true;
    this.isDropdownOpen = false;
    // In a real app, this would handle actual authentication
    console.log('User signed in');
  }

  signOut(): void {
    this.isAuthenticated = false;
    this.isDropdownOpen = false;
    // In a real app, this would clear authentication tokens
    console.log('User signed out');
  }

  // UI toggle methods
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    // In a real app, this would persist the preference
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // Quote calculation
  calculateQuote(): void {
    if (
      !this.quoteForm.fromLocation ||
      !this.quoteForm.toLocation ||
      !this.quoteForm.weightCategory
    ) {
      alert('Please fill in all required fields');
      return;
    }

    const selectedTier = this.pricingTiers.find(
      (tier) => tier.name === this.quoteForm.weightCategory
    );
    if (!selectedTier) {
      alert('Invalid weight category selected');
      return;
    }

    let basePrice = selectedTier.price;
    let surcharge = 0;

    // Apply service type surcharges
    switch (this.quoteForm.serviceType) {
      case 'express':
        surcharge = basePrice * 0.5; // 50% surcharge
        break;
      case 'same-day':
        surcharge = basePrice * 1.0; // 100% surcharge
        break;
      default:
        surcharge = 0;
    }

    const total = basePrice + surcharge;
    const estimatedDelivery = this.calculateEstimatedDelivery();

    this.calculatedQuote = {
      total: Math.round(total * 100) / 100, // Round to 2 decimal places
      estimatedDelivery,
      basePrice,
      surcharge,
    };

    console.log('Quote calculated:', this.calculatedQuote);
  }

  private calculateEstimatedDelivery(): string {
    const today = new Date();
    let deliveryDays = 0;

    switch (this.quoteForm.serviceType) {
      case 'same-day':
        return 'Today';
      case 'express':
        deliveryDays = 1;
        break;
      default:
        deliveryDays = 3;
    }

    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + deliveryDays);

    return deliveryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Package tracking
  trackPackage(): void {
    if (!this.trackingNumber.trim()) {
      alert('Please enter a tracking number');
      return;
    }

    // Simulate API call with mock data
    setTimeout(() => {
      this.trackingResult = {
        trackingNumber: this.trackingNumber,
        status: 'In Transit',
        from: 'New York, NY',
        to: 'Los Angeles, CA',
        estimatedDelivery: 'July 26, 2025',
      };
      console.log('Package tracked:', this.trackingResult);
    }, 1000);
  }

  // Navigation methods
  navigateToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    this.isMobileMenuOpen = false;
  }

  navigateToDashboard(): void {
    // In a real app, this would use Angular Router
    console.log('Navigating to dashboard...');
    window.location.href = '/dashboard';
  }

  navigateToProfile(): void {
    // In a real app, this would use Angular Router
    console.log('Navigating to profile...');
    window.location.href = '/profile';
  }

  // Utility methods
  private checkAuthenticationStatus(): void {
    // In a real app, this would check localStorage or a service
    const token = localStorage.getItem('auth_token');
    this.isAuthenticated = !!token;
  }

  private loadUserPreferences(): void {
    // In a real app, this would load user preferences from a service
    const darkModePreference = localStorage.getItem('dark_mode');
    this.isDarkMode = darkModePreference === 'true';

    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }

  // Form validation helpers
  isQuoteFormValid(): boolean {
    return !!(
      this.quoteForm.fromLocation &&
      this.quoteForm.toLocation &&
      this.quoteForm.weightCategory
    );
  }

  isTrackingFormValid(): boolean {
    return !!this.trackingNumber.trim();
  }

  // Event handlers for clicks outside dropdowns
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-container')) {
      this.isDropdownOpen = false;
    }
  }

  // Smooth scroll to top
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Contact methods
  openContactSupport(): void {
    // In a real app, this might open a chat widget or modal
    console.log('Opening contact support...');
  }

  openHelpCenter(): void {
    // In a real app, this would navigate to help center
    console.log('Opening help center...');
  }

  // Social sharing methods
  shareOnSocial(platform: string): void {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(
      'Check out SendIT - Fast & Reliable Courier Service'
    );

    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  }

  // Analytics tracking (placeholder)
  trackEvent(eventName: string, properties?: any): void {
    console.log('Analytics event:', eventName, properties);
    // In a real app, this would send to analytics service
  }

  // Error handling
  handleError(error: any): void {
    console.error('Application error:', error);
    // In a real app, this would send to error reporting service
  }
}
