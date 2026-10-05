// Stand-in for the unchanged parts of @cssints/icons (iconify and fs sources, the data URL, the nearest name).
export interface Icon {
  body: string;
}
export interface Source {
  label: string;
  get(name: string): Icon | undefined;
  names(): string[];
}
export declare const iconify: (collection: string) => Source;
export declare const files: (dir: string) => Source;
export declare const urlOf: (icon: Icon) => string;
export declare const nearest: (name: string, names: string[]) => string | undefined;
