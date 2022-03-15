import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import Shopify, { ApiVersion } from "@shopify/shopify-api";
import Koa from "koa";
import next from "next";
import Router from "koa-router";
import serve from "koa-static";
import bodyParser from "koa-bodyparser";
import routes from "./router/index";
import RedisStore from "./redis-store";
import * as Metafields from "./controllers/metafield_controller";

dotenv.config();
const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
});
const handle = app.getRequestHandler();

const getSessionStorage = () => {
  if (process.env.NODE_ENV != "production") {
    return new Shopify.Session.MemorySessionStorage();
  }

  // Create a new instance of the custom storage class
  const sessionStorage = new RedisStore();

  return new Shopify.Session.CustomSessionStorage(
    sessionStorage.storeCallback.bind(sessionStorage),
    sessionStorage.loadCallback.bind(sessionStorage),
    sessionStorage.deleteCallback.bind(sessionStorage)
  );
};

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES.split(","),
  HOST_NAME: process.env.HOST.replace(/^https:\/\//, ""),
  API_VERSION: ApiVersion.January22,
  IS_EMBEDDED_APP: true,
  // This should be replaced with your preferred storage strategy
  SESSION_STORAGE: getSessionStorage(),
});

// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS = {};

app.prepare().then(async () => {
  const server = new Koa();
  const router = new Router();
  server.use(bodyParser());
  server.keys = [Shopify.Context.API_SECRET_KEY];
  server.use(
    createShopifyAuth({
      // accessMode: "offline",
      async afterAuth(ctx) {
        // Access token and shop available in ctx.state.shopify
        const { shop, accessToken, scope } = ctx.state.shopify;
        const host = ctx.query.host;
        ACTIVE_SHOPIFY_SHOPS[shop] = scope;

        const response = await Shopify.Webhooks.Registry.register({
          shop,
          accessToken,
          path: "/webhooks",
          topic: "APP_UNINSTALLED",
          webhookHandler: async (topic, shop, body) =>
            delete ACTIVE_SHOPIFY_SHOPS[shop],
        });

        if (!response.success) {
          console.log(
            `Failed to register APP_UNINSTALLED webhook: ${response.result}`
          );
        }

        // Redirect to app with shop parameter upon auth
        ctx.redirect(`/?shop=${shop}&host=${host}`);
      },
    })
  );

  const handleRequest = async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  };

  router.post("/webhooks", async (ctx) => {
    try {
      await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
      console.log(`Webhook processed, returned status code 200`);
    } catch (error) {
      console.log(`Failed to process webhook: ${error}`);
    }
  });

  router.post(
    "/graphql",
    verifyRequest({ returnHeader: true }),
    async (ctx, next) => {
      await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
    }
  );

  async function injectSession(ctx, next) {
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    //
    //const session = await Shopify.Utils.loadOfflineSession(process.env.SHOP);

    ctx.sesionFromToken = session;
    if (session?.shop && session?.accessToken) {
      const client = new Shopify.Clients.Rest(
        session.shop,
        session.accessToken
      );
      ctx.myClient = client;
      console.log(session.accessToken);
    }
    return next();
  }

  server.use(injectSession);
  server.use(routes());

  server.use(serve(__dirname + "/public"));

  router.get("(/_next/static/.*)", handleRequest); // Static content is clear
  router.get("/_next/webpack-hmr", handleRequest); // Webpack content is clear

  router.get("/external/metafields/:id", async (ctx) => {
    try {
      const sessionLoad = await Shopify.Utils.loadOfflineSession(ctx.params.id);
      console.log("sessionLoad", sessionLoad);

      const clientWithSessionParams = {
        clientType: "rest",
        isOnline: false,
        shop: ctx.params.id,
      };

      const { client } = await Shopify.Utils.withSession(
        clientWithSessionParams
      );

      const shopMetafields = await Metafields.get(client);

      ctx.body = shopMetafields;

      console.log("shopMetafields -> ", shopMetafields);
    } catch (error) {
      console.log(error);
    }

    ctx.body = "";
  });

  const baypassRoutes = [".js", "external"];

  router.get("(.*)", async (ctx, next) => {
    const hasPath = !!baypassRoutes.find(
      (i) => ctx.request.URL.pathname.indexOf(i) !== -1
    );

    if (hasPath) next();

    const shop = ctx.query.shop;

    // This shop hasn't been seen yet, go through OAuth to create a session
    if (ACTIVE_SHOPIFY_SHOPS[shop] === undefined) {
      ctx.redirect(`/auth?shop=${shop}`);
    } else {
      await handleRequest(ctx);
    }
  });

  server.use(router.routes());
  server.use(router.allowedMethods());
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
