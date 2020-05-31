import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ViewportService {
  renderer: Renderer2;
  private orient$ = new BehaviorSubject<OrientationType>(
    window.screen.orientation.type || 'landscape-primary'
  );
  orientation = this.orient$.asObservable();

  private viewportHeight$ = new BehaviorSubject<number>(window.innerHeight);
  viewportHeight = this.viewportHeight$.asObservable();

  private viewportWidth$ = new BehaviorSubject<number>(window.innerHeight);
  viewportWidth = this.viewportWidth$.asObservable();

  constructor(private rendererFactory2: RendererFactory2) {
    this.renderer = this.rendererFactory2.createRenderer(null, null);
    this.renderer.listen('window', 'resize', $event => this.orientationHandler($event));
    this.renderer.listen('window', 'orientationchange', $event => this.orientationHandler($event));
  }

  orientationHandler($event: Event): void {
    let orient: OrientationType = window.screen.orientation.type || 'landscape-primary';
    if ($event.type === 'orientationchange') {
      orient = window.screen.orientation.type;
    }
    if ($event.type === 'resize') {
      orient =
        window.innerHeight > window.innerWidth && orient === 'landscape-primary'
          ? 'portrait-primary'
          : orient;
    }
    this.orient$.next(orient);
    this.viewportHeight$.next(window.innerHeight);
    this.viewportWidth$.next(window.innerHeight);
  }
}
