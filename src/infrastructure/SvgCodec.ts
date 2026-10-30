import { DOMParser, XMLSerializer, DOMImplementation } from "@xmldom/xmldom";
import type { Element, Document as XmlDocument } from "@xmldom/xmldom";
import { SvgDocument } from "../domain/SvgDocument.js";
import { ShapeFactory } from "../domain/ShapeFactory.js";
import { Numbers } from "../domain/Numbers.js";
import type { Shape } from "../domain/Shape.js";
import type { SvgElement } from "../domain/SvgElement.js";
import type { ReadResult } from "../application/ports/DocumentStore.js";
import { SvgTransform } from "./SvgTransform.js";
export class SvgCodec {
  private readonly factory = new ShapeFactory();
  private elements(element: Element): Element[] {
    const result: Element[] = [];
    for (let i = 0; i < element.childNodes.length; i++) {
      const node = element.childNodes.item(i);
      if (node?.nodeType === 1) result.push(node as Element);
    }
    return result;
  }
  decode(source: string): ReadResult {
    if (/<!DOCTYPE|<!ENTITY/i.test(source))
      throw new Error("DTD and entity declarations are not supported");
    const parsed = new DOMParser({
      onError: (_level, message) => {
        throw new Error(message);
      },
    }).parseFromString(source, "application/xml");
    const root = parsed.documentElement;
    if (
      !root ||
      root.localName !== "svg" ||
      (root.namespaceURI && root.namespaceURI !== "http://www.w3.org/2000/svg")
    )
      throw new Error("expected SVG root element");
    const width = Numbers.parse(root.getAttribute("width") || "800", "width");
    const height = Numbers.parse(
      root.getAttribute("height") || "600",
      "height",
    );
    const viewBox = root.getAttribute("viewBox") || undefined;
    if (viewBox) {
      const values = viewBox.trim().split(/[\s,]+/);
      if (values.length !== 4) throw new Error("invalid viewBox");
      const nums = values.map((v) => Numbers.parse(v, "viewBox"));
      Numbers.positive(nums[2]!, "viewBox width");
      Numbers.positive(nums[3]!, "viewBox height");
    }
    const document = new SvgDocument(width, height, viewBox);
    const warnings: string[] = [];
    const ids = new Set<string>();
    const reserve = (node: Element): void => {
      const id = node.getAttribute("id");
      if (id) {
        if (ids.has(id)) throw new Error("id already exists: " + id);
        ids.add(id);
      }
      for (const child of this.elements(node)) reserve(child);
    };
    for (const child of this.elements(root)) reserve(child);
    const counters = new Map<string, number>();
    const read = (element: Element): Shape => {
      const type = element.localName ?? element.tagName;
      if (element.namespaceURI && element.namespaceURI !== root.namespaceURI)
        throw new Error("unsupported element namespace");
      let id = element.getAttribute("id");
      if (!id) {
        let counter = counters.get(type) ?? 0;
        do {
          counter++;
          id = type + counter;
        } while (ids.has(id));
        counters.set(type, counter);
        ids.add(id);
        warnings.push(
          "warning: assigned id " + id + " to unnamed <" + type + ">",
        );
      }
      const attributes: Record<string, string> = {};
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes.item(i)!;
        attributes[attr.name] = attr.value;
      }
      const shape = this.factory.fromAttributes(
        type,
        id,
        attributes,
        element.textContent ?? "",
      );
      // Attribute validation is delegated to the polymorphic shape, not a tag switch.
      const known = new Set([
        ...Object.keys(shape.attributes()),
        "id",
        "transform",
        "xmlns",
        "data-kind",
      ]);
      for (const [key, value] of Object.entries(attributes)) {
        if (known.has(key)) continue;
        shape.importPresentation(key, value);
      }
      for (const child of this.elements(element))
        shape.asContainer().insert(read(child));
      new SvgTransform(attributes.transform ?? "").apply(shape);
      return shape;
    };
    for (const child of this.elements(root)) document.add(read(child));
    const rootAllowed = new Set([
      "xmlns",
      "width",
      "height",
      "viewBox",
      "version",
      "id",
    ]);
    for (let i = 0; i < root.attributes.length; i++)
      if (!rootAllowed.has(root.attributes.item(i)!.name))
        throw new Error(
          "unsupported SVG root attribute: " + root.attributes.item(i)!.name,
        );
    return { document, warnings };
  }
  encode(document: SvgDocument): string {
    const xml = new DOMImplementation().createDocument(
      "http://www.w3.org/2000/svg",
      "svg",
      null,
    );
    const build = (node: SvgElement, owner: XmlDocument): Element => {
      const element = owner.createElementNS(
        "http://www.w3.org/2000/svg",
        node.tag,
      );
      for (const [key, value] of Object.entries(node.attributes))
        element.setAttribute(key, value);
      if (node.text) element.appendChild(owner.createTextNode(node.text));
      for (const child of node.children)
        element.appendChild(build(child, owner));
      return element;
    };
    xml.replaceChild(build(document.toElement(), xml), xml.documentElement!);
    return (
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      new XMLSerializer().serializeToString(xml) +
      "\n"
    );
  }
}
