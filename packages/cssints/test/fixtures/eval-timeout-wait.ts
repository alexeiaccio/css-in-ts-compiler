// plain module: its top level takes longer than CSSINTS_EVAL_TIMEOUT (eval-timeout.mjs)
await new Promise((resolve) => setTimeout(resolve, 1000));
export {};
