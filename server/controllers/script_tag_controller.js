import { DataType } from "@shopify/shopify-api";

function makeScriptTag(metafield = {}) {
  const appData = Buffer.from(JSON.stringify(metafield)).toString("base64");
  return {
    event: "onload",
    src: `//cdn.shopify.com/s/files/1/0502/6316/3060/t/11/assets/teste.js?v=${Date.now()}&appdata=${appData}`,
  };
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

export async function updateScriptTag(client, metafield = {}, id) {
  // if (client) {
  const { body } = await client.put({
    path: `script_tags/${id}`,
    data: {
      script_tag: makeScriptTag(metafield),
    },
    type: DataType.JSON,
  });
  console.log(`Resultado da requisição de script foi`, body);
  return body;
  // }
  //console.error("Could not make the rest request as the client does not exist");
}

export async function getAllScriptTags(client, src) {
  if (!client) {
    console.error(
      "Could not make the rest request as the client does not exist"
    );
    return;
  }
  const { body } = await client.get({
    path: "script_tags",
  });

  body.script_tags.filter((tag) => console.log(tag.src));

  const matchSrc = body.script_tags.filter((tag) => tag.src === src);
  return matchSrc;
}

export async function deleteScriptTagById(client, id) {
  if (!client) {
    console.error(
      "Could not make the rest request as the client does not exist"
    );
    return;
  }
  const { body } = await client.delete({
    path: `script_tags/${id}`,
  });
  console.log(body);
  return body;
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
