import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, signal, computed, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

import { PharmacyMapService }  from '../../services/pharmacy-map.service';
import { PharmacyCardComponent } from '../pharmacy-card/pharmacy-card';
import { PharmacyLocation }    from '../../models/pharmacy-location.model';

// ── Fix Leaflet's broken default icon paths under esbuild / webpack ──────────
// Without this, markers show as broken images because bundlers rename asset files.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Custom marker icons ───────────────────────────────────────────────────────
const defaultIcon = L.divIcon({
  className: '',
  html: `<div class="map-marker map-marker--default">
           <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
             <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
           </svg>
         </div>`,
  iconSize:   [32, 40],
  iconAnchor: [16, 40],
  popupAnchor:[0, -40],
});

const selectedIcon = L.divIcon({
  className: '',
  html: `<div class="map-marker map-marker--selected">
           <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
             <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
           </svg>
         </div>`,
  iconSize:   [40, 50],
  iconAnchor: [20, 50],
  popupAnchor:[0, -50],
});

const closedIcon = L.divIcon({
  className: '',
  html: `<div class="map-marker map-marker--closed">
           <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
             <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
           </svg>
         </div>`,
  iconSize:   [32, 40],
  iconAnchor: [16, 40],
  popupAnchor:[0, -40],
});

@Component({
  selector: 'app-pharmacies-map',
  standalone: true,
  imports: [CommonModule, FormsModule, PharmacyCardComponent],
  templateUrl: './pharmacies-map.html',
  styleUrl: './pharmacies-map.scss'
})
export class PharmaciesMapComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('mapContainer') mapContainerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('cardList')     cardListRef!: ElementRef<HTMLDivElement>;

  // ── State signals ──────────────────────────────────────────────────────────
  locations  = signal<PharmacyLocation[]>([]);
  loading    = signal(true);
  errorMsg   = signal('');
  selectedId = signal<number | null>(null);
  mobileView = signal<'list' | 'map'>('list');

  // ── Filter state (plain properties — ngModel binding) ─────────────────────
  searchQuery  = '';
  selectedCity = '';

  // ── Derived signals ────────────────────────────────────────────────────────
  cities = computed(() => this.mapService.getCities(this.locations()));

  filtered = computed(() => {
    const q    = this.searchQuery.trim().toLowerCase();
    const city = this.selectedCity;
    return this.locations().filter(p => {
      const matchesName = !q    || p.name.toLowerCase().includes(q)
                                 || p.address.toLowerCase().includes(q);
      const matchesCity = !city || p.city === city;
      return matchesName && matchesCity;
    });
  });

  mappable = computed(() =>
    this.filtered().filter(p => p.latitude !== null && p.longitude !== null)
  );

  // ── Leaflet internals ──────────────────────────────────────────────────────
  private map!: L.Map;
  private markers = new Map<number, L.Marker>();
  private mapInitialized = false;

  constructor(
    private mapService: PharmacyMapService,
    private cdr: ChangeDetectorRef
  ) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadLocations();
  }

  ngAfterViewInit(): void {
    // Initialize map for desktop immediately; mobile map tab initializes lazily
    if (window.innerWidth >= 768) {
      this.initMap();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  // ── Data loading ───────────────────────────────────────────────────────────

  loadLocations(): void {
    this.loading.set(true);
    this.errorMsg.set('');
    this.mapService.getLocations().subscribe({
      next: (data) => {
        this.locations.set(data);
        this.loading.set(false);
        // Render markers after data arrives (map may already be ready)
        setTimeout(() => this.refreshMarkers(), 0);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message ?? 'Failed to load pharmacies. Please try again.');
        this.loading.set(false);
      }
    });
  }

  // ── Map initialisation ─────────────────────────────────────────────────────

  private initMap(): void {
    if (this.mapInitialized || !this.mapContainerRef) return;

    this.map = L.map(this.mapContainerRef.nativeElement, {
      center:  [9.0320, 38.7469],   // Addis Ababa
      zoom:    12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.mapInitialized = true;
    this.refreshMarkers();
  }

  // ── Marker management ──────────────────────────────────────────────────────

  private refreshMarkers(): void {
    if (!this.mapInitialized) return;

    // Remove all existing markers
    this.markers.forEach(m => m.remove());
    this.markers.clear();

    const sel = this.selectedId();

    this.mappable().forEach(pharmacy => {
      const isSelected = pharmacy.id === sel;
      const icon = isSelected ? selectedIcon
                 : pharmacy.isOpen ? defaultIcon
                 : closedIcon;

      const marker = L.marker(
        [pharmacy.latitude!, pharmacy.longitude!],
        { icon }
      ).addTo(this.map);

      marker.bindPopup(this.buildPopupHtml(pharmacy), {
        maxWidth: 280,
        className: 'pharmacy-popup'
      });

      marker.on('click', () => {
        this.selectPharmacy(pharmacy.id, false);
      });

      this.markers.set(pharmacy.id, marker);
    });
  }

  private buildPopupHtml(p: PharmacyLocation): string {
    const statusClass = p.isOpen ? 'popup-open' : 'popup-closed';
    const statusText  = p.isOpen ? '● Open'     : '● Closed';
    return `
      <div class="popup-content">
        <h4 class="popup-name">${this.escHtml(p.name)}</h4>
        <p  class="popup-address">${this.escHtml(p.address)}</p>
        <p  class="popup-phone">📞 ${this.escHtml(p.phone)}</p>
        <p  class="popup-status ${statusClass}">${statusText}</p>
      </div>`;
  }

  private escHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Selection and sync ─────────────────────────────────────────────────────

  /** Called from card click OR marker click.
   *  @param flyToMap — if true, the map flies to the pharmacy location.
   */
  selectPharmacy(id: number, flyToMap = true): void {
    const prev = this.selectedId();
    this.selectedId.set(id);

    // Update icon on previously selected marker
    if (prev !== null && prev !== id) {
      const prevMarker   = this.markers.get(prev);
      const prevPharmacy = this.locations().find(p => p.id === prev);
      if (prevMarker && prevPharmacy) {
        prevMarker.setIcon(prevPharmacy.isOpen ? defaultIcon : closedIcon);
      }
    }

    // Update icon on newly selected marker
    const marker   = this.markers.get(id);
    const pharmacy = this.locations().find(p => p.id === id);

    if (marker && pharmacy) {
      marker.setIcon(selectedIcon);

      if (flyToMap && pharmacy.latitude !== null && pharmacy.longitude !== null) {
        this.map.flyTo([pharmacy.latitude, pharmacy.longitude], 15, { duration: 0.5 });
        marker.openPopup();
      }
    }

    // Scroll the card into view in the list panel
    this.cdr.detectChanges();
    requestAnimationFrame(() => {
      const cardEl = this.cardListRef?.nativeElement
        .querySelector(`[data-id="${id}"]`) as HTMLElement | null;
      cardEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  // ── Filter handlers ────────────────────────────────────────────────────────

  onSearchChange(): void {
    // Clear selection if selected pharmacy is no longer in filtered results
    const sel = this.selectedId();
    if (sel !== null && !this.filtered().some(p => p.id === sel)) {
      this.clearSelection();
    }
    this.refreshMarkers();
  }

  onCityChange(): void {
    const sel = this.selectedId();
    if (sel !== null && !this.filtered().some(p => p.id === sel)) {
      this.clearSelection();
    }
    this.refreshMarkers();
  }

  clearFilters(): void {
    this.searchQuery  = '';
    this.selectedCity = '';
    this.clearSelection();
    this.refreshMarkers();
  }

  private clearSelection(): void {
    const prev = this.selectedId();
    if (prev !== null) {
      const prevMarker   = this.markers.get(prev);
      const prevPharmacy = this.locations().find(p => p.id === prev);
      if (prevMarker && prevPharmacy) {
        prevMarker.setIcon(prevPharmacy.isOpen ? defaultIcon : closedIcon);
      }
    }
    this.selectedId.set(null);
  }

  // ── Mobile tab toggle ──────────────────────────────────────────────────────

  switchToMapView(): void {
    this.mobileView.set('map');
    // Initialise lazily — only when tab is first activated so the container
    // has a size. A second call is a no-op because of mapInitialized guard.
    this.cdr.detectChanges();
    setTimeout(() => {
      if (!this.mapInitialized && this.mapContainerRef) {
        this.initMap();
      } else if (this.map) {
        this.map.invalidateSize();
      }
    }, 50);
  }

  switchToListView(): void {
    this.mobileView.set('list');
  }

  // ── Template helpers ───────────────────────────────────────────────────────

  isSelected(id: number): boolean {
    return this.selectedId() === id;
  }

  get hasActiveFilter(): boolean {
    return this.searchQuery.trim().length > 0 || this.selectedCity.length > 0;
  }

  get totalWithCoords(): number {
    return this.locations().filter(p => p.latitude !== null).length;
  }
}
