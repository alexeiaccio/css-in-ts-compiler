import { Effect, Layer } from 'effect';
import { FileService } from './file-service.ts';
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';

const main = Effect.gen(function*() {
  const fileService = yield* FileService;
  
  // Test exists
  const exists = yield* fileService.exists('./package.json');
  console.log('package.json exists:', exists);
});

Effect.runPromise(
  main.pipe(
    Effect.provide(FileService.layer),
    Effect.provide(NodeFileSystem.layer),
    Effect.provide(NodePath.layer),
  ),
).then(() => console.log('Done'));
