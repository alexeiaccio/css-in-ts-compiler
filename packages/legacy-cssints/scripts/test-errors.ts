import { Schema } from 'effect';

export class ProcessError extends Schema.TaggedErrorClass<ProcessError>("ProcessError")({
	step: Schema.String,
	reason: Schema.String,
}) {}

const err = new ProcessError({ step: "test", reason: "failed" });
console.log('Error created:', err);
console.log('Has _tag:', '_tag' in err);
console.log('_tag value:', (err as any)._tag);
