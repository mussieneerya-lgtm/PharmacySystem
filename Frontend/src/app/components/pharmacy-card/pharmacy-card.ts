import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PharmacyLocation } from '../../models/pharmacy-location.model';

@Component({
  selector: 'app-pharmacy-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pharmacy-card.html',
  styleUrl: './pharmacy-card.scss'
})
export class PharmacyCardComponent {
  @Input({ required: true }) pharmacy!: PharmacyLocation;
  @Input() selected = false;

  @Output() cardClicked = new EventEmitter<PharmacyLocation>();

  onClick(): void {
    this.cardClicked.emit(this.pharmacy);
  }

  get hasCoordinates(): boolean {
    return this.pharmacy.latitude !== null && this.pharmacy.longitude !== null;
  }
}
