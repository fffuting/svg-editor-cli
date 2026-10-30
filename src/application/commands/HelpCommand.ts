import { Command } from "./Command.js";
import type { EditorSession } from "../EditorSession.js";
export class HelpCommand extends Command {
  override execute(_session: EditorSession): readonly string[] {
    this.args.expect(0);
    return [
      `init [w] [h]                 新建画布（默认 800×600）
read <file.svg>               读入 SVG
save [file.svg]               保存 SVG
canvas [w h]                 查询或修改画布
create rect <id> <x> <y> <w> <h> [fill] [in <containerId>]
create circle <id> <cx> <cy> <r> [fill] [in <containerId>]
create ellipse <id> <cx> <cy> <rx> <ry> [fill] [in <containerId>]
create line <id> <x1> <y1> <x2> <y2> [stroke] [in <containerId>]
create text <id> <x> <y> "content" [in <containerId>]
create g <id> [in <containerId>]
delete <id>                   删除子树
move <id> <dx> <dy>            增量平移
scale <id> <factor>            位置与尺寸等比缩放
set <id> <attr> <value>        修改白名单属性
group <newGid> <id1> [id2...]   收编已有节点
ungroup <gid>                 解散非根级容器
addto <gid> <id>              移入容器末尾
front <id> / back <id>        同级绘制顺序（front 最后绘制）
tree [id] / show <id>         查看结构或属性
undo / redo                   撤销或重做一条编辑
help                          查看帮助
# 开头的行是注释；带空格参数用双引号；EOF 退出。`,
    ];
  }
}
