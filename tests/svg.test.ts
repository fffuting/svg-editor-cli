import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  rmSync,
  readdirSync,
} from "node:fs";

import { join } from "node:path";
import { SvgCodec } from "../src/infrastructure/SvgCodec.js";
import { SvgDocumentStore } from "../src/infrastructure/SvgDocumentStore.js";
import { SvgDocument } from "../src/domain/SvgDocument.js";
import { ShapeFactory } from "../src/domain/ShapeFactory.js";
import { EditorSession } from "../src/application/EditorSession.js";
import { CommandDispatcher } from "../src/cli/CommandDispatcher.js";
const codec = new SvgCodec();
test("SVG round-trip preserves all six types, order, text, styles and viewBox", () => {
  const source = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="-10 -20 800 600"><g id="scene" fill="blue"><rect id="r" x="1.5" y="-2" width="3" height="4"/><circle id="c" cx="4" cy="5" r="2"/><ellipse id="e" rx="2" ry="3"/><line id="l" x2="7" y2="8" stroke="red" stroke-width="2"/><text id="t" x="3" y="9" font-size="16" text-anchor="middle">中文 &amp; &lt;xml&gt; "quotes"</text><g id="empty"/></g></svg>`;
  const first = codec.decode(source);
  const encoded = codec.encode(first.document);
  const second = codec.decode(encoded);
  assert.deepEqual(second.document.toElement(), first.document.toElement());
  assert.deepEqual(second.warnings, []);
  assert.match(encoded, /&amp;/);
  assert.match(encoded, /&lt;xml/);
  assert.equal(
    second.document.find("t").toElement().text,
    '中文 & <xml> "quotes"',
  );
  assert.equal(second.document.find("t").attributes()["font-size"], "16");
});
test("missing ids reserve all explicit ids first, including later and nested nodes", () => {
  const result = codec.decode(
    '<svg><rect/><g><rect id="rect1"/><circle/></g><rect id="rect3"/><rect/></svg>',
  );
  assert.deepEqual(
    result.document.all().map((s) => s.id),
    ["rect2", "g1", "rect1", "circle1", "rect3", "rect4"],
  );
  assert.deepEqual(result.warnings, [
    "warning: assigned id rect2 to unnamed <rect>",
    "warning: assigned id g1 to unnamed <g>",
    "warning: assigned id circle1 to unnamed <circle>",
    "warning: assigned id rect4 to unnamed <rect>",
  ]);
});
test("nested translate/uniform scale imports follow SVG transform order", () => {
  const doc = codec.decode(
    '<svg><g id="outer" transform="translate(60,40)"><g id="inner" transform="translate(200,0) scale(0.8)"><rect id="r" x="10" y="20" width="120" height="60"/></g></g></svg>',
  ).document;
  assert.deepEqual(doc.find("r").attributes(), {
    id: "r",
    x: "268",
    y: "56",
    width: "96",
    height: "48",
  });
  assert.deepEqual(
    codec.decode(codec.encode(doc)).document.toElement(),
    doc.toElement(),
  );
});
for (const [name, source, expected] of [
  [
    "duplicate id",
    '<svg><g id="g"><rect id="a"/></g><circle id="a"/></svg>',
    /id already exists: a/,
  ],
  ["malformed XML", "<svg><g></svg>", /./],
  [
    "unknown shape",
    '<svg><polygon id="p"/></svg>',
    /unknown shape type: polygon/,
  ],
  [
    "unsafe entity",
    '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg/>',
    /DTD/,
  ],
  [
    "unknown attribute",
    '<svg><rect id="r" onclick="alert(1)"/></svg>',
    /unsupported SVG attribute/,
  ],
  ["negative radius", '<svg><circle id="c" r="-1"/></svg>', /nonnegative/],
  [
    "non-container child",
    '<svg><rect id="r"><circle id="c"/></rect></svg>',
    /not a container/,
  ],
  [
    "unsupported transform",
    '<svg><g id="g" transform="rotate(30)"/></svg>',
    /unsupported SVG transform/,
  ],
  [
    "anisotropic transform",
    '<svg><g id="g" transform="scale(2,3)"/></svg>',
    /uniform/,
  ],
  ["invalid viewBox", '<svg viewBox="0 0 1"/>', /invalid viewBox/],
] as const)
  test("rejects " + name, () =>
    assert.throws(() => codec.decode(source), expected),
  );
test("filesystem saves atomically, tracks path and preserves history on failure", () => {
  const dir = mkdtempSync(join(process.cwd(), ".svg-test-"));
  try {
    const target = join(dir, "drawing.svg");
    const store = new SvgDocumentStore();
    const session = new EditorSession(store);
    const cli = new CommandDispatcher(session);
    cli.execute("init");
    cli.execute("create rect r 1 2 3 4");
    assert.doesNotMatch(cli.execute(`save "${target}"`)[0]!, /^error:/);
    assert.ok(readFileSync(target, "utf8").includes('id="r"'));
    cli.execute("move r 4 0");
    assert.doesNotMatch(cli.execute("save")[0]!, /^error:/);
    assert.equal(store.read(target).document.find("r").attributes().x, "5");
    cli.execute("move r 1 0");
    const before = session.current().tree();
    const bad = join(dir, "broken.svg");
    writeFileSync(bad, "<svg><g>");
    assert.match(cli.execute(`read "${bad}"`)[0]!, /^error:/);
    assert.equal(session.current().tree(), before);
    assert.match(
      cli.execute(`save "${dir}"`)[0]!,
      /^error: cannot write file:/,
    );
    assert.equal(session.current().tree(), before);
    cli.execute("undo");
    assert.equal(session.current().find("r").attributes().x, "5");
    assert.deepEqual(readdirSync(dir).sort(), ["broken.svg", "drawing.svg"]);
    assert.throws(
      () => store.read(join(dir, "missing.svg")),
      /cannot read file:/,
    );
    assert.throws(
      () => store.write(join(dir, "absent", "x.svg"), new SvgDocument()),
      /cannot write file:/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("omitted styles remain omitted and do not receive fabricated defaults", () => {
  const doc = new SvgDocument();
  const factory = new ShapeFactory();
  doc.add(factory.create("rect", "r", ["0", "0", "2", "2"]));
  doc.add(factory.create("line", "l", ["0", "0", "2", "2"]));
  const xml = codec.encode(doc);
  assert.doesNotMatch(xml, /fill=|stroke=/);
  assert.deepEqual(codec.decode(xml).document.toElement(), doc.toElement());
});
