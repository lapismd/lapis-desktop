import { unknown } from "./syntax.mjs";

export function literal(node, env = {}) {
  if (!node) return unknown;
  if (node.type === "Literal") return node.value;
  if (node.type === "Identifier")
    return Object.hasOwn(env, node.name) ? env[node.name] : unknown;
  if (node.type === "LogicalExpression") {
    const a = literal(node.left, env);
    if (a === unknown) return unknown;
    if (node.operator === "||") return a || literal(node.right, env);
    if (node.operator === "&&") return a && literal(node.right, env);
    if (node.operator === "??") return a ?? literal(node.right, env);
  }
  if (node.type === "UnaryExpression" && node.operator === "!") {
    const value = literal(node.argument, env);
    return value === unknown ? unknown : !value;
  }
  if (node.type === "BinaryExpression") {
    const a = literal(node.left, env),
      b = literal(node.right, env);
    if (a === unknown || b === unknown) return unknown;
    if (["===", "=="].includes(node.operator)) return a === b;
    if (["!==", "!="].includes(node.operator)) return a !== b;
  }
  return unknown;
}
export function attribute(node, name, env) {
  const attr = node.attributes?.find(
    (a) => a.type === "Attribute" && a.name === name,
  );
  if (!attr) return undefined;
  if (attr.value === true) return true;
  if (Array.isArray(attr.value)) {
    if (attr.value.length === 1 && attr.value[0].type === "Text")
      return attr.value[0].data;
    if (attr.value.length === 1 && attr.value[0].expression)
      return literal(attr.value[0].expression, env);
    return unknown;
  }
  return literal(attr.value?.expression, env);
}
