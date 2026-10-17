// Every MCP server is off in this repository. Their definitions live in the global config
// (~/.config/opencode/opencode.json, both the V2 `mcp.servers` shape and V1-style direct names); a project config cannot
// switch them off without repeating each definition (and its secrets) to override it, so the switch is a transform:
// whatever is configured, it is disabled here, and the servers do not connect or reach the model.
// Delete this file to have them back.
interface Context {
  readonly mcp: {
    transform(
      callback: (editor: {
        list(): readonly (readonly [string, unknown])[];
        update(name: string, update: (server: { disabled?: boolean }) => void): void;
      }) => void,
    ): Promise<{ dispose(): Promise<void> }>;
  };
}

export default {
  id: "cssints.no-mcp",
  setup(ctx: Context) {
    return ctx.mcp
      .transform((editor) => {
        for (const [name] of editor.list()) {
          editor.update(name, (server) => {
            server.disabled = true;
          });
        }
      })
      .then((registration) => () => registration.dispose());
  },
};
