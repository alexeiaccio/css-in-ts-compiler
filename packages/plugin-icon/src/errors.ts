import * as Data from "effect";

export class IconNotFoundError extends Data.TaggedError("IconNotFoundError")<{
  readonly identifier: string;
  readonly availableCollections?: readonly string[];
}> {}

export class IconLoadError extends Data.TaggedError("IconLoadError")<{
  readonly identifier: string;
  readonly cause: unknown;
}> {}

export class InvalidIconIdentifier extends Data.TaggedError("InvalidIconIdentifier")<{
  readonly identifier: string;
  readonly cause?: unknown;
}> {}

export class CollectionLoadError extends Data.TaggedError("CollectionLoadError")<{
  readonly collection: string;
  readonly cause: unknown;
}> {}

export class DuplicateNameWarning extends Data.TaggedError("DuplicateNameWarning")<{
  readonly originalName: string;
  readonly transformedName: string;
  readonly previousPath: string;
  readonly newPath: string;
}> {}
