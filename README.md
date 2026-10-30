# SVG Editor CLI

Git 仓库：https://github.com/fffuting/svg-editor-cli

课程完整文档：[doc/README.md](doc/README.md)。最终版本使用 `final` 标签定位。

需要 Node.js 22 或更新版本（含 npm）。

```sh
npm ci
npm run check
npm run cli
```

进入 `svg>` 后输入 `help`。退出使用 Ctrl+C 或 EOF。

回放示例（PowerShell）：

```powershell
Get-Content examples/flowchart.txt -Encoding utf8 | npm run cli
```

Linux/macOS：`npm run cli < examples/flowchart.txt`。

生成的 `examples/flowchart.svg` 可直接用浏览器打开。
