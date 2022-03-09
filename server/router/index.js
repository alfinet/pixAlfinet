import combineRouters from "koa-combine-routers";
import scriptsRouter from "./scripts";
import metafieldsRouter from "./metafields";

const router = combineRouters(scriptsRouter, metafieldsRouter);

export default router;
