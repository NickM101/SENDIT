import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './auth/services/auth.service';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';

declare global {
  interface Window {
    HSStaticMethods: {
      autoInit: () => void;
    };
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, ToastContainerComponent],
})
export class AppComponent implements OnInit {
  title = 'SendIT';
  showLayout = true;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.listenToRouterEvents();
  }

  /**
   * Listens to router events to manage layout visibility
   * and trigger UI initialization logic
   */
  private listenToRouterEvents(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.handleLayoutVisibility(event.url);
        this.initializeUIComponents();
      });
  }

  /**
   * Determines whether to show the main layout
   */
  private handleLayoutVisibility(url: string): void {
    const isAuthRoute = url.startsWith('/auth');
    this.showLayout = !isAuthRoute && this.authService.isAuthenticated;
  }

  /**
   * Initializes third-party UI components
   */
  private initializeUIComponents(): void {
    setTimeout(() => {
      if (window?.HSStaticMethods?.autoInit) {
        window.HSStaticMethods.autoInit();
      }
    }, 100);
  }
}


