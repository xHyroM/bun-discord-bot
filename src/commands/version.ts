import { defineCommand } from "../loaders/commands.ts";
import { COMMIT_HASH, PRODUCTION } from "../constants.ts"; 
import { InteractionCommandContext } from "../structs/context/CommandContext.ts";

export default defineCommand({
  name: "version",
  options: [],
  run: (context: InteractionCommandContext) => {
    context.interaction.reply({
      content: [
        `[git-bun-discord-bot-${COMMIT_HASH}](<https://github.com/xHyroM/bun-discord-bot/tree/${COMMIT_HASH}>) ${!PRODUCTION ? "(dev)" : ""}`,
        `[v${Bun.version} (${Bun.revision})](<https://github.com/oven-sh/bun/releases/tag/bun-v${Bun.version}>)`
      ].join("\n"),
      ephemeral: true,
    });
  }
});
