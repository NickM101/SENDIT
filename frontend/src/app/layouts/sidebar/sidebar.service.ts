import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  getSidebarItemsForRole,
  SidebarItem,
} from '../../core/config/sidebar.config';
import { UserRole } from '../../auth/models/auth.models';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private _items = new BehaviorSubject<SidebarItem[]>([]);
  public readonly items$ = this._items.asObservable();

  constructor() {}

  setRole(role: UserRole): void {
    const config = getSidebarItemsForRole(role);
    this._items.next(config);
  }
}
