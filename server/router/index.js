import combineRouters from "koa-combine-routers";
import scriptTagRouter from "./script_tag";

console.log("fui chamado 1");
const router = combineRouters(scriptTagRouter);

export default router;
