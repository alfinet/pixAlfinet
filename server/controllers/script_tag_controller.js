import { DataType } from "@shopify/shopify-api";

export async function createScriptTag(client) {
  if (client) {
    const data = {
      script_tag: {
        event: "onload",
        src:
          "//cdn.shopify.com/s/files/1/0502/6316/3060/t/11/assets/teste.js?v=15010666606992974210",
      },
    };
    const result = await client.post({
      path: "script_tags",
      data,
      type: DataType.JSON,
    });
    console.log(`Resultado da requisição de script foi`, result);
    return result;
  }
  console.error("Could not make the rest request as the client does not exist");
}

export async function getAllScriptTags(client, src) {
  if (!client) {
    console.error(
      "Could not make the rest request as the client does not exist"
    );
    return;
  }
  var result = await client.get({
    path: "script_tags",
  });

  result.body.script_tags.filter((tag) => console.log(tag.src));

  const matchSrc = result.body.script_tags.filter((tag) => tag.src === src);
  return matchSrc;
}

export async function deleteScriptTagById(client, id) {
  if (!client) {
    console.error(
      "Could not make the rest request as the client does not exist"
    );
    return;
  }
  const result = await client.delete({
    path: `script_tags/${id}`,
  });
  console.log(result);
  return result;
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
