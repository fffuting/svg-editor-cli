import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, basename, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
const root = fileURLToPath(new URL("../../src/", import.meta.url));
const files = readdirSync(root, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
  .map((entry) => join(entry.parentPath, entry.name));
test("all source imports follow the documented dependency direction", () => {
  const allowed: Record<string, readonly string[]> = {
    domain: ["domain"],
    application: ["application", "domain"],
    cli: ["cli", "application"],
    infrastructure: ["infrastructure", "application", "domain"],
    bootstrap: ["bootstrap", "cli", "application", "infrastructure", "domain"],
  };
  for (const file of files) {
    const from = relative(root, file).split(/[\\/]/)[0]!;
    const source = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const visit = (node: ts.Node): void => {
      if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        const spec = node.moduleSpecifier.text;
        if (spec.startsWith(".")) {
          const target = relative(root, resolve(file, "..", spec)).split(
            /[\\/]/,
          )[0]!;
          assert.ok(
            allowed[from]?.includes(target),
            `${file}: forbidden dependency ${spec}`,
          );
        } else if (from === "domain" || from === "application")
          assert.fail(`${file}: core must not import ${spec}`);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
});
test("one named class per file, encapsulated state and no any or tag switches", () => {
  for (const file of files) {
    const source = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    let classes = 0;
    const visit = (node: ts.Node): void => {
      assert.notEqual(
        node.kind,
        ts.SyntaxKind.AnyKeyword,
        `${file}: explicit any`,
      );
      if (ts.isSwitchStatement(node))
        assert.fail(`${file}: switch dispatch is not allowed`);
      if (ts.isClassDeclaration(node)) {
        classes++;
        assert.equal(node.name?.text, basename(file, ".ts"));
      }
      if (ts.isPropertyDeclaration(node)) {
        const visibility = node.modifiers?.some(
          (mod) =>
            mod.kind === ts.SyntaxKind.PrivateKeyword ||
            mod.kind === ts.SyntaxKind.ProtectedKeyword,
        );
        assert.ok(
          visibility,
          `${file}: public mutable field ${node.name.getText(source)}`,
        );
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    assert.ok(classes <= 1, file);
    assert.equal(
      source.statements.some((node) => ts.isFunctionDeclaration(node)),
      false,
      `${file}: top-level procedural function`,
    );
  }
});
