import L from "leaflet";
import "leaflet.fullscreen";
import "leaflet-gesture-handling";

declare module "leaflet" {
  interface MapOptions {
    gestureHandling?: boolean;
    fullscreenControl?: boolean;
    fullscreenControlOptions?: {
      position: string;
    };
  }

  namespace control {
    function fullscreen<T>(v: any): T;
  }
}
