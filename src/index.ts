import nearley, { CompiledRules } from "nearley";
import makeLexer from "./lexer.js";
import grammar from "./grammar.js";

class Parser extends nearley.Parser {
  constructor() {
    super(nearley.Grammar.fromCompiled(grammar as CompiledRules));
  }
}

function parseAST(source: string) {
  const parser = new Parser();
  parser.feed(source);
  if (parser.results[0]) {
    return parser.results[0];
  } else {
    throw new Error("could not parse");
  }
}

function parseValue(source: string, h = defaultFactory) {
  const ast = parseAST(source);
  return toValue(ast, h);
}

export { makeLexer, grammar, Parser, parseAST, parseValue };

function defaultFactory(
  name: unknown,
  attributes: unknown,
  ...children: unknown[]
) {
  return {
    _JSXElement: true,
    name,
    attributes,
    children,
  };
}

type LiteralNode<T = unknown> = { type: "Literal"; value: T };
type ArrayNode = { type: "Array"; children: Node[] };
type ObjectNode = {
  type: "Object";
  children: { key: LiteralNode<string>; value: Node }[];
};
type NameNode = { type: "Name"; name: string };
type ExpressionNode = { type: "Expression"; expression: Node };
type ElementNode = {
  type: "Element";
  name: NameNode;
  attributes: { name: NameNode; value: Node | undefined }[];
  children: Node[];
};

type Node =
  | LiteralNode
  | ArrayNode
  | ObjectNode
  | NameNode
  | ExpressionNode
  | ElementNode;

function toValue(node: Node, h: typeof defaultFactory): unknown {
  switch (node.type) {
    case "Literal":
      return node.value;
    case "Array":
      return node.children.map((child) => toValue(child, h));
    case "Object":
      return node.children.reduce((obj, { key, value }) => {
        return {
          ...obj,
          [key.value]: toValue(value, h),
        };
      }, {});
    case "Name":
      return node.name;
    case "Expression":
      return toValue(node.expression, h);
    case "Element":
      return h(
        toValue(node.name, h),
        node.attributes.reduce((obj, { name, value }) => {
          return {
            ...obj,
            [name.name]:
              typeof value === "undefined" ? true : toValue(value, h),
          };
        }, {}),
        ...node.children.map((child) => toValue(child, h))
      );
    default:
      return node;
  }
}
