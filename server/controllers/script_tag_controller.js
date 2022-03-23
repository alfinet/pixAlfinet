import { DataType } from "@shopify/shopify-api";

/**
 * @typedef { import("@shopify/shopify-api/dist/clients/rest/rest_client").RestClient } RestClient
 */

const scriptFileName = "pix-dist.js";
const assetKey = "layout/theme.liquid";
const tag = "<!-- alfinet -->";
const scriptBlock = /\<\!-- alfinet --\>(.*)\<\!-- alfinet\.end --\>/gm;
const scriptTagIdBlock = /\<\!-- alfinet\.scriptag\.id=(.*?) --\>/;

const _defaultResult = {
  installed: false,
  details: undefined,
  scriptTagId: undefined,
};

// utils

/**
 *
 * @param {number} scriptTagId
 * @param {import("./metafield_controller").MetafieldPix} metafield
 * @returns
 */
function makeScript(scriptTagId = undefined, metafield = {}) {
  if (!scriptTagId) throw new Error("invalid scriptTagId");
  // _alfinet_pix_user_data
  const appData = Buffer.from(JSON.stringify(metafield)).toString("base64");
  console.log("makeScript", appData);
  return `${tag}<!-- alfinet.scriptag.id=${scriptTagId} --><script id=\"alfinet.pix.qrcode\">document.cookie = "_alfinet_pix_user_data=${appData}";</script><!-- alfinet.end -->`;
}

/**
 *
 * @param {string} value
 * @param {number} scriptTagId
 * @param {import("./metafield_controller").MetafieldPix} metafield
 * @returns
 */
function shouldInstallOrReplaceTag(value, scriptTagId, metafield) {
  if (value.indexOf("<!-- alfinet -->") !== -1) {
    return value.replace(scriptBlock, makeScript(scriptTagId, metafield));
  }

  return value.replace(
    "</body>",
    `${makeScript(scriptTagId, metafield)}</body>`
  );
}

// themes path methods

/**
 *
 * @param {RestClient} client
 * @returns {Promise<{value: string, id: number}>}
 */
async function getLayoutTheme(client) {
  const {
    body: { themes },
  } = await client.get({
    path: "themes",
  });

  const { id } = themes.find((theme) => theme.role === "main");

  const assetResult = await client.get({
    path: `themes/${id}/assets`,
    query: { "asset[key]": assetKey },
  });

  console.log("assetResult: ", assetResult);
  return Promise.resolve({ value: assetResult.body.asset.value, id });
}

/**
 *
 * @param {RestClient} client
 * @param {number} id
 * @param {string} value
 * @returns
 */
async function updateLayoutTheme(client, id, value) {
  const { body: liquidOp } = await client.put({
    path: `themes/${id}/assets`,
    data: {
      asset: {
        key: assetKey,
        value,
      },
    },
    type: DataType.JSON,
  });

  console.log("[updateLayoutTheme] liquid operation", liquidOp);
  return liquidOp;
}

// script_tags path methods

/**
 *
 * @param {RestClient} client
 * @returns
 */
async function findScriptTag(client) {
  console.log(`[findScriptTag]`);
  const { body } = await client.get({
    path: `script_tags`,
    type: DataType.JSON,
  });

  const { script_tags } = body;

  console.log(`[findScriptTag] body`, body);
  console.log(`[findScriptTag] script_tags`, script_tags);

  if (!script_tags) return undefined;
  return script_tags.find((i) => i.src.indexOf(scriptFileName) !== -1);
}

/**
 *
 * @param {RestClient} client
 * @param {number} id
 * @returns
 */
async function getScriptTagById(client, id) {
  console.log(`[findScriptTag]`, id);
  if (!id || id < 0) return { errors: "invalid id" };
  const { body } = await client.get({
    path: `script_tags/${id}`,
    type: DataType.JSON,
  });
  console.log(`[createScriptTag]`, body);
  return body;
}

/**
 *
 * @param {RestClient} client
 * @returns
 */
export async function createScriptTag(client) {
  console.log(`[createScriptTag]`);
  const { body } = await client.post({
    path: "script_tags",
    data: {
      script_tag: {
        src: `${process.env.HOST}/${scriptFileName}`,
        event: "onload",
      },
    },
    type: DataType.JSON,
  });
  console.log(`[createScriptTag]`, body);
  return body;
}

/**
 *
 * @param {RestClient} client
 * @param {number} id
 * @returns
 */
export async function deleteScriptTagById(client, id) {
  console.log(`[deleteScriptTagById]`, id);
  if (!id || id < 0) return { errors: "invalid id" };
  const { body } = await client.delete({
    path: `script_tags/${id}`,
    type: DataType.JSON,
  });

  console.log(`[deleteScriptTagById]`, body);
  return body;
}

// Scripts * check / install / uninstall

/**
 *
 * @param {RestClient} client
 * @returns
 */
export async function checkScriptsStatus(client) {
  console.log("[getAllScriptTags]");

  const { value } = await getLayoutTheme(client);

  const details = value.match(scriptBlock);

  console.log("[getAllScriptTags] details", details);

  const installed = details && details.length > 0;
  let scriptTagId;

  if (installed) {
    try {
      scriptTagId = Number(details[0].match(scriptTagIdBlock)[1]);
    } catch (error) {
      console.log(error);
      return _defaultResult;
    }
  }

  const body = await getScriptTagById(client, scriptTagId);

  if (typeof body === "object" && "errors" in body) {
    let found = await findScriptTag(client);

    if (!found) return _defaultResult;
  }

  return {
    installed,
    details,
    scriptTagId,
  };
}

/**
 *
 * @param {RestClient} client
 * @param {import("./metafield_controller").MetafieldPix} metafield
 * @returns
 */
export async function installScripts(client, _tagId, metafield) {
  console.log("[installScripts]", metafield);

  if (!metafield) return _defaultResult;

  let found;

  if (!_tagId) found = await findScriptTag(client);

  if (!found) {
    const { script_tag } = await createScriptTag(client);
    found = script_tag;
  }

  const { id: scriptTagId } = found || {};

  console.log("[installScripts] found", found, scriptTagId);

  const { value, id } = await getLayoutTheme(client);

  let newValue = shouldInstallOrReplaceTag(value, scriptTagId, metafield);

  console.log("[installScripts] value", newValue);

  const { asset } = await updateLayoutTheme(client, id, newValue);

  console.log("[installScripts] asset", asset);

  if (!asset || !asset.checksum) {
    return _defaultResult;
  }

  const details = String(newValue).match(scriptBlock);

  console.log("[installScripts] details", details);

  return {
    installed: details && details.length > 0,
    details,
    scriptTagId,
  };
}

/**
 *
 * @param {RestClient} client
 * @param {number} scriptTagId
 * @param {import("./metafield_controller").MetafieldPix} metafield
 * @returns
 */
export async function updateScripts(client, _tagId, metafield) {
  console.log("[updateScriptTag]", metafield, _tagId);

  if (!metafield) return _defaultResult;

  const { value, id } = await getLayoutTheme(client);

  if (!_tagId) {
    let found = await findScriptTag(client);

    if (!found) {
      const { script_tag } = await createScriptTag(client);
      found = script_tag;
    }

    if (found) _tagId = found.id;
  }

  if (!_tagId) return _defaultResult;

  let newValue = shouldInstallOrReplaceTag(value, _tagId, metafield);

  console.log("[updateScriptTag] value", newValue);

  const { value: updated } = await updateLayoutTheme(client, id, newValue);

  const details = String(updated).match(scriptBlock);

  console.log("[updateScriptTag] updated", updated);
  console.log("[updateScriptTag] details", details);

  const body = await getScriptTagById(client, _tagId);

  if (typeof body === "object" && "errors" in body) {
    const scriptTag = await createScriptTag(client);
    _tagId = scriptTag.id;
  }

  return {
    installed: details && details.length > 0,
    details,
    scriptTagId: _tagId,
  };
}

/**
 *
 * @param {RestClient} client
 * @param {number} scriptTagId
 * @returns
 */
export async function uninstallScripts(client, scriptTagId) {
  console.log("[uninstallScripts]", scriptTagId);

  const { value, id } = await getLayoutTheme(client);

  await updateLayoutTheme(client, id, value.replace(scriptBlock, ""));

  try {
    // possible 404
    await deleteScriptTagById(client, scriptTagId);
  } catch (error) {
    console.log(error);
  }

  return _defaultResult;
}
