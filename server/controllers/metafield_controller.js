import { DataType } from "@shopify/shopify-api";

export const PATH = "metafields";
const NAMESPACE = "alfinet.pix";
const META_KEY = "qrcode";
const type = DataType.JSON;

/**
 * @typedef { import("@shopify/shopify-api/dist/clients/rest/rest_client").RestClient } RestClient
 *
 * @typedef {object} Metafield - named type 'Metafield'
 * @property {string} id - The unique ID of the metafield
 * @property {string} description - A description of the information that the metafield contains
 * @property {string} created_at - The date and time (ISO 8601 format) when the metafield was created.
 * @property {string} updated_at - The date and time (ISO 8601 format) when the metafield was last updated.
 * @property {string} namespace - A container for a set of metafields
 * @property {number} owner_id - The unique ID of the resource that the metafield is attached to
 * @property {number} owner_resource - The type of resource that the metafield is attached to
 * @property {*} value - The information to be stored as metadata
 * @property { string | number | boolean } type - The metafield's information type
 *
 * @typedef {object} RequiredErrors - named type 'CreateError'. Creating a metafield without a key will fail and return an error
 * @property {{[string]: Array<*>}} errors - key: array of grouped errors
 *
 * @typedef {{bankName?: string, bg?: string, city?: string, fullName?: string, message?: string, pixKey?: string}} MetafieldPix
 */

/**
 * Make a generic metafield error
 * @param {string=} context
 * @param {string=} message
 * @returns {Error}
 */
const invalidError = (context = "", message = "") =>
  new Error(`[${PATH}::${context}] invalid client`);

/**
 * Make a invalid client error
 * @param {string=} context
 * @returns {Error}
 */
const invalidClientError = (context = "") =>
  invalidError(context, "invalid client");

const makeMetafieldOf = (values) => {
  return {
    namespace: NAMESPACE,
    key: META_KEY,
    value: JSON.stringify(values),
    type: "json",
  };
};

/**
 * Creates a new metafield for a resource
 * @param {RestClient} client
 * @param {MetafieldPix} value
 * @returns {PromiseLike<Record<"metafield", Metafield> | RequiredErrors>}
 */
export async function create(client, values) {
  if (!client) throw invalidClientError("create");
  if (!values) throw invalidError("create", "value cannot be undefined");

  console.log("[metafields] create values", values);

  const { body } = await client.post({
    path: PATH,
    data: {
      metafield: makeMetafieldOf(values),
    },
    type,
  });
  console.log("[metafields] create", body);
  return body;
}

/**
 * Updates a metafield
 * @param {RestClient} client Shopify client agent
 * @param {number} id
 * @returns {PromiseLike<Record<"metafield", Metafield> | RequiredErrors>}
 */
export async function update(client, values, id) {
  if (!client) throw invalidClientError("remove");
  if (!values) throw invalidError("update", "id cannot be undefined");

  console.log("[metafields] update values", values);

  const { body } = await client.put({
    path: `${PATH}/${id}`,
    data: {
      metafield: makeMetafieldOf(values),
    },
    type,
  });

  console.log("[metafields] update", body);
  return body;
}

/**
 * Retrieve metafields that belong to a Shop resource
 * @param {RestClient} client Shopify client agent
 * @returns {PromiseLike<Metafield | null>}
 * @example
 * {
    "id": 721389482,
    "namespace": "alfinet.pix",
    "key": "qrcode",
    "value": "{\"pixKey\":\"some cpf\",\"fullName\":\"some name\",\"bankName\":\"NuBank\",\"message\":\"some message\",\"bg\":\"#000000\",\"city\":\"some city\"}",
    "value_type": "json",
    "description": null,
    "owner_id": 690933842,
    "created_at": "2020-01-14T10:41:30-05:00",
    "updated_at": "2020-01-14T10:41:30-05:00",
    "owner_resource": "shop",
    "admin_graphql_api_id": "gid://shopify/Metafield/721389482"
  }
 */
export async function get(client) {
  if (!client) throw invalidClientError("list");

  var result = await client.get({
    path: PATH,
    query: {
      namespace: NAMESPACE,
      key: META_KEY,
    },
  });

  console.log("[metafields] get result", result.body);
  const { metafields } = result.body;
  if (metafields && metafields.length) {
    console.log("[metafields] get found", metafields[0]);

    return {
      ...JSON.parse(metafields[0].value),
      id: metafields[0].id,
    };
  }

  return null;
}

/**
 * Deletes a metafield
 * @param {RestClient} client Shopify client agent
 * @param {number} id
 * @returns {Object} {}
 */
export async function remove(client, id) {
  if (!client) throw invalidClientError("remove");
  if (!value) throw invalidError("remove", "id cannot be undefined");

  const { body } = await client.delete({
    path: `${PATH}/${id}`,
  });

  console.log("[metafields] remove", body);
  return body;
}
