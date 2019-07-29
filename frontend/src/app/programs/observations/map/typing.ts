import * as L from "leaflet";
import "leaflet-fullscreen";

declare module "leaflet" {
  namespace Control {
    class Fullscreen extends Control {
      constructor(options?: FullscreenOptions);
      options: FullscreenOptions;
    }

    interface FullscreenOptions {
      position?: ControlPosition;
      title?: { false: string; true: string };
    }
  }

  namespace control {
    function fullscreen(
      options?: Control.FullscreenOptions
    ): Control.Fullscreen;
  }
}
