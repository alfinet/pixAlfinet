import combineRouters from "koa-combine-routers";
import scriptTagRouter from "./script_tag";
import metafieldsRouter from "./metafields";

const router = combineRouters(scriptTagRouter, metafieldsRouter);

export default router;
