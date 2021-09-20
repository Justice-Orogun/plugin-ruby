import type { Plugin, Ruby } from "./types";

const {
  concat,
  group,
  join,
  indent,
  line,
  softline
} = require("../../prettier");
import { literal } from "../../utils";

function printRestParamSymbol(symbol: string): Plugin.Printer<Ruby.KeywordRestParam | Ruby.RestParam> {
  return function printRestParamWithSymbol(path, opts, print) {
    return path.getValue().body[0]
      ? concat([symbol, path.call(print, "body", 0)])
      : symbol;
  };
}

export const printParams: Plugin.Printer<Ruby.Params> = (path, opts, print) => {
  const [reqs, optls, rest, post, kwargs, kwargRest, block] =
    path.getValue().body;
  let parts: Plugin.Doc[] = [];

  if (reqs) {
    path.each(
      (reqPath) => {
        // For some very strange reason, if you have a comment attached to a
        // rest_param, it shows up here in the list of required params.
        if (reqPath.getValue().type !== "rest_param") {
          parts.push(print(reqPath));
        }
      },
      "body",
      0
    );
  }

  if (optls) {
    parts = parts.concat(
      path.map((optlPath) => join(" = ", optlPath.map(print)), "body", 1)
    );
  }

  if (rest && rest.type !== "excessed_comma") {
    parts.push(path.call(print, "body", 2));
  }

  if (post) {
    parts = parts.concat(path.map(print, "body", 3));
  }

  if (kwargs) {
    parts = parts.concat(
      path.map(
        (kwargPath) => {
          if (!kwargPath.getValue()[1]) {
            return kwargPath.call(print, 0);
          }
          return group(join(" ", kwargPath.map(print)));
        },
        "body",
        4
      )
    );
  }

  if (kwargRest) {
    parts.push(kwargRest === "nil" ? "**nil" : path.call(print, "body", 5));
  }

  if (block) {
    parts.push(path.call(print, "body", 6));
  }

  const contents = [join(concat([",", line]), parts)];

  // You can put an extra comma at the end of block args between pipes to
  // change what it does. Below is the difference:
  //
  // [[1, 2], [3, 4]].each { |x| p x } # prints [1, 2] then [3, 4]
  // [[1, 2], [3, 4]].each { |x,| p x } # prints 1 then 3
  //
  // In ruby 2.5, the excessed comma is indicated by having a 0 in the rest
  // param position. In ruby 2.6+ it's indicated by having an "excessed_comma"
  // node in the rest position. Seems odd, but it's true.
  if ((rest as any) === 0 || (rest && rest.type === "excessed_comma")) {
    contents.push(",");
  }

  // If the parent node is a paren then we skipped printing the parentheses so
  // that we could handle them here and get nicer formatting.
  if (["lambda", "paren"].includes(path.getParentNode().type)) {
    return group(
      concat(["(", indent(concat([softline].concat(contents))), softline, ")"])
    );
  }

  return group(concat(contents));
};

export const printArgsForward = literal("...");
export const printKeywordRestParam = printRestParamSymbol("**");
export const printRestParam = printRestParamSymbol("*");
