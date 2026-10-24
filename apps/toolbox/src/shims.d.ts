declare interface Window {
  // extend the window
}

declare module "*.vue" {
  import { type DefineComponent } from "vue";

  // oxlint-disable-next-line @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
