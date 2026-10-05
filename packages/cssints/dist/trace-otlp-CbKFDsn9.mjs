import { Layer, ManagedRuntime } from "effect";
import { FetchHttpClient } from "effect/http";
import { OtlpSerialization, OtlpTracer } from "effect/observability";
//#region src/trace-otlp.ts
const start = (url) => {
	const runtime = ManagedRuntime.make(OtlpTracer.layer({
		url: `${url}/v1/traces`,
		resource: { serviceName: "cssints" },
		exportInterval: "500 millis"
	}).pipe(Layer.provide([OtlpSerialization.layerJson, FetchHttpClient.layer])));
	return runtime.context().then(() => runtime);
};
//#endregion
export { start };
