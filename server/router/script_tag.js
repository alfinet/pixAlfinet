import Router from "koa-router";
import {
  createScriptTag,
  deleteScriptTagById,
  getAllScriptTags,
  updateScriptTag,
} from "../controllers/script_tag_controller";
import * as Metafields from "../controllers/metafield_controller";

const router = new Router({ prefix: "/script_tag" });

router.get("/", async (ctx) => {
  ctx.body = "Get script tag";
});

router.get("/all", async (ctx) => {
  const result = await getAllScriptTags(ctx.myClient);
  ctx.body = result;
});

router.post("/", async (ctx) => {
  const body = await Metafields.get(ctx.myClient);
  ctx.body = await updateScriptTag(ctx.myClient, body || {});
});

router.put("/", async (ctx) => {
  const body = await Metafields.get(ctx.myClient);
  ctx.body = await updateScriptTag(ctx.myClient, body || {});
});

router.delete("/", async (ctx) => {
  ctx.body = await deleteScriptTagById(ctx.myClient);
});

export default router;
