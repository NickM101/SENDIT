import { Component } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';

// Define interfaces for our data structures for better type safety
interface PricingTier {
  icon: string;
  name: string;
  weight: string;
  price: number;
  pricePeriod: string;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule], // Import NgIf and NgFor for conditional and repeated content
  templateUrl: './landing-page.component.html',
})
export class LandingPageComponent {
  // --- AUTHENTICATION STATE ---
  // In a real app, this would be managed by an authentication service (e.g., using a BehaviorSubject).
  // For this demo, we'll use a simple boolean to toggle between states.
  isAuthenticated = false;
  isDropdownOpen = false;

  user = {
    name: 'Alicia Koch',
    email: 'alicia.koch@example.com',
    // Using a placeholder for the avatar
    avatarUrl: 'https://placehold.co/40x40/E0E7FF/4F46E5?text=AK',
  };

  // --- COMPONENT DATA ---
  // Storing data here makes the template cleaner and the component easier to manage.

  pricingTiers: PricingTier[] = [
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 mb-2 text-indigo-600"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
      name: 'Light',
      weight: '0 - 5kg',
      price: 15,
      pricePeriod: 'Starting price',
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 mb-2 text-indigo-600"><path d="M12 22V12"/><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/></svg>`,
      name: 'Medium',
      weight: '5 - 15kg',
      price: 25,
      pricePeriod: 'Starting price',
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 mb-2 text-indigo-600"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/><path d="M21 12v4"/><path d="M12 12 3.3 7"/></svg>`,
      name: 'Heavy',
      weight: '15 - 30kg',
      price: 45,
      pricePeriod: 'Starting price',
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 mb-2 text-indigo-600"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73Z"/><path d="M12 22v-6"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="m12 16 8.7-5"/><path d="M12 12v4"/><path d="M12 12 3.3 7"/><path d="m20.7 7-8.7 5"/></svg>`,
      name: 'Extra Heavy',
      weight: '30kg+',
      price: 75,
      pricePeriod: 'Starting price',
    },
  ];

  features: Feature[] = [
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 text-white"><path d="M5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M10 3h4v4h-4Z"/><path d="M10 10h4v4h-4Z"/><path d="M2 3h2"/><path d="M7 3h2"/><path d="M15 3h2"/><path d="M20 3h2"/><path d="m21 12-2.5-2.5"/><path d="m3 12 2.5-2.5"/><path d="M2 12h.01"/><path d="M21.99 12h.01"/><path d="M12 12h-2"/><path d="M14 12h-2"/></svg>`,
      title: 'Fast Delivery',
      description:
        'Same-day and next-day delivery options available for urgent packages.',
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 text-white"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
      title: 'Secure Handling',
      description:
        'Your package is safe with us, handled with care and tracked throughout the journey.',
    },
    {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 text-white"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
      title: 'Real-time Tracking',
      description:
        'Monitor your package movement and delivery status in real-time.',
    },
  ];

  // --- METHODS ---

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  // Placeholder methods to simulate auth actions
  signIn() {
    this.isAuthenticated = true;
    this.isDropdownOpen = false;
  }

  signOut() {
    this.isAuthenticated = false;
    this.isDropdownOpen = false;
  }
}
