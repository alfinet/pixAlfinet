import { DataType } from "@shopify/shopify-api";

const scriptBlock = /\<\!-- alfinet --\>(.*)\<\!-- alfinet\.end --\>/gm;

function makeScript(metafield = {}) {
  const appData = Buffer.from(JSON.stringify(metafield)).toString("base64");
  console.log("makeScript", appData);
  const src = `//cdn.shopify.com/s/files/1/0502/6316/3060/t/11/assets/teste.js?v=${Date.now()}`;
  return `<!-- alfinet --><script id=\"alfinet.pix.qrcode\" type=\"text/plain\">${appData}</script><script src=\"${src}\" defer=\"defer\"></script><!-- alfinet.end -->`;
}

export async function createScriptTag(client, metafield = {}) {
  const { body } = await client.post({
    path: "script_tags",
    data: {
      script_tag: makeScriptTag(metafield),
    },
    type: DataType.JSON,
  });
  console.log(`Resultado da requisição de script foi`, body);
  return body;
}

export async function updateScriptTag(client, metafield = {}) {
  console.log("---> updateScriptTag", metafield);
  const {
    body: { themes },
  } = await client.get({
    path: "themes",
  });

  const { id } = themes.find((theme) => theme.role === "main");

  const assetResult = await client.get({
    path: `themes/${id}/assets`,
    query: { "asset[key]": "layout/theme.liquid" },
  });

  console.log("assetResult: ", assetResult);

  const {
    body: {
      asset: { value },
    },
  } = assetResult;

  let newValue = value;

  if (value.indexOf("<!-- alfinet -->") !== -1) {
    newValue = value.replace(scriptBlock, makeScript(metafield));
  } else {
    newValue = value.replace("</body>", `${makeScript(metafield)}</body>`);
    console.log("---> updateScriptTag newValue", newValue);
  }

  const { body: liquidOp } = await client.put({
    path: `themes/${id}/assets`,
    data: {
      asset: {
        key: "layout/theme.liquid",
        value: newValue,
      },
    },
    type: DataType.JSON,
  });

  console.log(liquidOp);

  const details = String(newValue).match(scriptBlock);

  console.log("---> updateScriptTag details", details);

  return {
    installed: details && details.length > 0,
    details,
  };
}

export async function getAllScriptTags(client) {
  console.log("---> getAllScriptTags");
  const {
    body: { themes },
  } = await client.get({
    path: "themes",
  });

  const { id } = themes.find((theme) => theme.role === "main");

  const assetResult = await client.get({
    path: `themes/${id}/assets`,
    query: { "asset[key]": "layout/theme.liquid" },
  });

  console.log("assetResult: ", assetResult);

  const {
    body: {
      asset: { value },
    },
  } = assetResult;

  const details = String(value).match(scriptBlock);
  console.log("details", details);

  return {
    installed: details && details.length > 0,
    details,
  };
}

export async function deleteScriptTagById(client) {
  console.log("---> deleteScriptTagById");

  const {
    body: { themes },
  } = await client.get({
    path: "themes",
  });

  const { id } = themes.find((theme) => theme.role === "main");

  const assetResult = await client.get({
    path: `themes/${id}/assets`,
    query: { "asset[key]": "layout/theme.liquid" },
  });

  console.log("assetResult: ", assetResult);

  const {
    body: {
      asset: { value },
    },
  } = assetResult;

  const newValue = value.replace(scriptBlock, "");

  const { body: liquidOp } = await client.put({
    path: `themes/${id}/assets`,
    data: {
      asset: {
        key: "layout/theme.liquid",
        value: newValue,
      },
    },
    type: DataType.JSON,
  });

  console.log(liquidOp);

  const details = String(newValue).match(scriptBlock);

  console.log("details", details);

  return {
    installed: details && details.length > 0,
    details,
  };
}

function getBaseUrl(shop) {
  return `https://${shop}`;
}

function getAllScriptTagsUrl(shop) {
  return `${getBaseUrl(shop)}/admin/api/2021-01/script_tags.json`;
}

function getScriptTagUrl(shop, id) {
  return `${getBaseUrl(shop)}/admin/api/2021-01/script_tags/${id}.json`;
}

function getCreateScriptTagUrl(shop) {
  return `${getBaseUrl(shop)}/admin/api/2021-01/script_tags.json`;
}

function getDeleteScriptTagUrl(shop, id) {
  return `${getBaseUrl(shop)}/admin/api/2021-01/script_tags/${id}.json`;
}
