declare module "@webref/css" {
	interface Property {
		name: string;
	}
	interface Data {
		properties: Property[];
	}
	function listAll(): Promise<Data>;
}

declare module "@webref/idl" {
	interface IDLFile {
		text(): Promise<string>;
	}
	function listAll(): Promise<Record<string, IDLFile>>;
}
