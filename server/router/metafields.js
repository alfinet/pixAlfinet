import Router from "koa-router";
import * as Metafields from "../controllers/metafield_controller";

const router = new Router({ prefix: `/${Metafields.PATH}` });

function resultFactory(
  ctx,
  { metafield = null, success = false, error = null }
) {
  let _metafield = null;

  if (metafield) {
    _metafield = {
      ...metafield,
      value: JSON.parse(metafield.value),
    };
  }

  ctx.body = {
    metafield: _metafield,
    success,
    status: ctx.status,
    error,
  };
}

async function mutationOperation(ctx, mode = "create", updateId = undefined) {
  console.log("ctx.request.body", ctx.request.body);
  try {
    const body = await Metafields[mode](
      ctx.myClient,
      ctx.request.body,
      updateId
    );
    ctx.status = 200;
    resultFactory(ctx, {
      metafield: body.metafield,
      success: true,
      error: null,
    });
  } catch (error) {
    ctx.status = 400;
    resultFactory(ctx, {
      error: error.statusText,
    });
  }
}

router.put("/:id", async (ctx) =>
  mutationOperation(ctx, "update", ctx.params.id)
);
router.post("/", async (ctx) => mutationOperation(ctx));

router.get("/", async (ctx) => {
  const body = await Metafields.get(ctx.myClient);
  if (!body) return (ctx.status = 404);
  ctx.body = body;
});

router.delete("/:id", async (ctx) => {
  const { id } = ctx.params;
  console.log(id);
  ctx.body = await Metafields.remove(ctx.myClient, id);
});

export default router;
