import { Effect, Layer, ServiceMap, Data, FileSystem, Path } from "effect";

export class FileError extends Data.TaggedError("FileError")<{
	readonly path: string;
	readonly operation: "read" | "write" | "mkdir";
	readonly reason: string;
}> {}

export class FileService extends ServiceMap.Service<
	FileService,
	{
		readonly readFileString: (path: string) => Effect.Effect<string, FileError>;
		readonly writeFileString: (path: string, content: string) => Effect.Effect<void, FileError>;
		readonly makeDirectory: (path: string) => Effect.Effect<void, FileError>;
		readonly exists: (path: string) => Effect.Effect<boolean, FileError>;
	}
>()("cssints/FileService") {
	static readonly layer = Layer.effect(
		FileService,
		Effect.gen(function* () {
			const fs = yield* FileSystem.FileSystem;
			const path = yield* Path.Path;

			const readFileString = Effect.fn("FileService.readFileString")(function* (filePath: string) {
				return yield* fs.readFileString(filePath).pipe(
					Effect.mapError(
						(error) =>
							new FileError({
								path: filePath,
								operation: "read",
								reason: error instanceof Error ? error.message : "Read failed",
							}),
					),
				);
			});

			const writeFileString = Effect.fn("FileService.writeFileString")(function* (filePath: string, content: string) {
				const dir = path.dirname(filePath);
				yield* fs.makeDirectory(dir, { recursive: true }).pipe(
					Effect.mapError(
						(error) =>
							new FileError({
								path: dir,
								operation: "mkdir",
								reason: error instanceof Error ? error.message : "mkdir failed",
							}),
					),
				);

				return yield* fs.writeFileString(filePath, content).pipe(
					Effect.mapError(
						(error) =>
							new FileError({
								path: filePath,
								operation: "write",
								reason: error instanceof Error ? error.message : "Write failed",
							}),
					),
				);
			});

			const makeDirectory = Effect.fn("FileService.makeDirectory")(function* (dirPath: string) {
				return yield* fs.makeDirectory(dirPath, { recursive: true }).pipe(
					Effect.mapError(
						(error) =>
							new FileError({
								path: dirPath,
								operation: "mkdir",
								reason: error instanceof Error ? error.message : "mkdir failed",
							}),
					),
				);
			});

			const exists = Effect.fn("FileService.exists")(function* (filePath: string) {
				return yield* fs.exists(filePath).pipe(
					Effect.mapError(
						(error) =>
							new FileError({
								path: filePath,
								operation: "read",
								reason: error instanceof Error ? error.message : "Check failed",
							}),
					),
				);
			});

			return {
				readFileString,
				writeFileString,
				makeDirectory,
				exists,
			};
		}),
	);
}
