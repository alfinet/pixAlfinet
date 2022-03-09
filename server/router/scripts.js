import Router from "koa-router";
import {
  installScripts,
  uninstallScripts,
  checkScriptsStatus,
  updateScripts,
} from "../controllers/script_tag_controller";
import * as Metafields from "../controllers/metafield_controller";

const router = new Router({ prefix: "/scripts" });

router.get("/", async (ctx) => {
  ctx.body = await checkScriptsStatus(ctx.myClient);
});

router.post("/", async (ctx) => {
  const body = await Metafields.get(ctx.myClient);
  ctx.body = await installScripts(
    ctx.myClient,
    ctx.request.body.id,
    body || {}
  );
});

router.put("/", async (ctx) => {
  const body = await Metafields.get(ctx.myClient);
  ctx.body = await updateScripts(ctx.myClient, ctx.request.body.id, body || {});
});

router.delete("/:id", async (ctx) => {
  ctx.body = await uninstallScripts(ctx.myClient, ctx.params.id);
});

export default router;
