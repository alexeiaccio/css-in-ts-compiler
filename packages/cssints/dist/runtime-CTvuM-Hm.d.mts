//#region src/runtime.d.ts
type ClassValue = string | false | null | undefined | 0 | ClassValue[];
declare const cx: (...a: ClassValue[]) => string;
//#endregion
export { cx as n, ClassValue as t };