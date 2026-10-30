import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";

import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { SvgCodec } from "../src/infrastructure/SvgCodec.js";
const entry = fileURLToPath(
  new URL("../src/bootstrap/main.js", import.meta.url),
);
test("real CLI executes the two-node flowchart and continues after an error", () => {
  const dir = mkdtempSync(join(process.cwd(), ".svg-test-cli-"));
  try {
    const script = `# flowchart example\ninit 800 600\ncreate g flowchart\ncreate g node1 in flowchart\ncreate rect start 120 100 160 60 #4a90d9 in node1\ncreate text start-label 155 135 "开始" in node1\ncreate g node2 in flowchart\ncreate rect process 520 100 160 60 #f5a623 in node2\ncreate text process-label 545 135 "处理数据" in node2\ncreate line arrow1 280 130 520 130 black in flowchart\nmove node2 0 100\nundo\nset process-label text "处理数据 v2"\ncreate box not-supported 0 0 1 1 "future"\ntree\nsave flowchart.svg\nundo\nread flowchart.svg\nshow start\n`;
    const result = spawnSync(process.execPath, [entry], {
      cwd: dir,
      input: script,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");
    assert.match(result.stdout, /svg> /);
    assert.match(result.stdout, /unknown shape type: box/);
    assert.match(result.stdout, /undo not allowed after io command/);
    assert.match(result.stdout, /parent=g#node1/);
    const doc = new SvgCodec().decode(
      readFileSync(join(dir, "flowchart.svg"), "utf8"),
    ).document;
    assert.equal(doc.all().length, 8);
    assert.equal(doc.find("process").attributes().y, "100");
    assert.equal(doc.find("process-label").toElement().text, "处理数据 v2");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
