/**
 * Post-Processor Error Types
 */

import { Data } from "effect";

export class PostProcessError extends Data.TaggedError("PostProcessError")<{
	message: string;
	rule?: string;
	details?: unknown;
}> {}

export class VisitorError extends Data.TaggedError("VisitorError")<{
	message: string;
	visitorName: string;
	rule?: unknown;
}> {}
