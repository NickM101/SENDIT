import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './auth/services/auth.service';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';


@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  imports: [CommonModule, RouterModule, ToastContainerComponent],
})
export class App implements OnInit {
  title = 'SendIT';
  showLayout = true;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.setupRouteListener();
  }

  /**
   * Setup route listener to determine when to show layout
   */
  private setupRouteListener(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Don't show layout for auth routes
        this.showLayout =
          !event.url.startsWith('/auth') && this.authService.isAuthenticated;
      });
  }
}