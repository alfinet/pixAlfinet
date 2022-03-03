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
  console.log("Get all script tag");
  console.log("ctx.state", ctx.state);
  const result = await getAllScriptTags(
    ctx.myClient,
    "//cdn.shopify.com/s/files/1/0502/6316/3060/t/11/assets/teste.js?v=15010666606992974210"
  );
  console.log(ctx.myClient);
  ctx.body = {
    installed: result && result.length > 0,
    details: result,
  };
});

router.post("/", async (ctx) => {
  console.log("ctx.request.body", ctx.request.body);
  console.log(ctx.myClient);
  const body = await Metafields.get(ctx.myClient);
  ctx.body = await createScriptTag(ctx.myClient, body || {});
});

router.put("/", async (ctx) => {
  console.log(ctx.myClient, ctx.params.id);
  const body = await Metafields.get(ctx.myClient);

  ctx.body = await updateScriptTag(ctx.myClient, body || {}, ctx.params.id);
});

router.delete("/", async (ctx) => {
  ctx.body = await deleteScriptTagById(ctx.myClient, ctx.params.id);
});

export default router;
