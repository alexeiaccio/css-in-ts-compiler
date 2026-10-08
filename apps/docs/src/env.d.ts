declare module "virtual:docs" {
  export const pages: import("./docs.ts").Docs["pages"];
  export const html: import("./docs.ts").Docs["html"];
}
