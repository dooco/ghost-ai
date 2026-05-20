import { logger, task } from "@trigger.dev/sdk";

export const helloWorld = task({
  id: "hello-world",
  run: async (payload: { name: string }) => {
    logger.info("Hello from Trigger.dev", { name: payload.name });
    return { message: `Hello, ${payload.name}!` };
  },
});
