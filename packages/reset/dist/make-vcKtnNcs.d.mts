//#region src/make.d.ts
declare const define: (group?: string) => import("cssints/plugin").Scope<"reset", {
  readonly reset: {
    readonly args: readonly [{
      readonly "media?": import("cssints/plugin").Typed<boolean>;
      readonly "prose?": import("cssints/plugin").Typed<boolean>;
    }];
  };
}>;
type Reset = ReturnType<ReturnType<typeof define>["export"]>["reset"];
//#endregion
export { Reset as t };