import {
  logger,
  task
} from "../../chunk-QB4TLHXA.mjs";
import "../../chunk-RA6RHLTU.mjs";
import {
  __name,
  init_esm
} from "../../chunk-NKKWNCEX.mjs";

// trigger/example.ts
init_esm();
var helloWorld = task({
  id: "hello-world",
  run: /* @__PURE__ */ __name(async (payload) => {
    logger.info("Hello from Trigger.dev", { name: payload.name });
    return { message: `Hello, ${payload.name}!` };
  }, "run")
});
export {
  helloWorld
};
//# sourceMappingURL=example.mjs.map
