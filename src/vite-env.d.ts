/// <reference types="vite/client" />

declare module "*.glb" {
  const src: string;
  export default src;
}

declare module "*.vert" {
  const content: string;
  export default content;
}

declare module "*.frag" {
  const content: string;
  export default content;
}
