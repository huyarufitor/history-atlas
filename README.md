# 经纬之间 · 世界历史地图

一个中文交互式历史地图网站，支持探索1900—2026年的年份与重要历史事件。

## 运行

建议 Node.js 22（`.nvmrc`）与 pnpm。

```sh
nvm use
pnpm install
pnpm dev
```

默认地址：http://127.0.0.1:5173 。地图数据已保存在 `public/data`，无需地图 API key，运行时不依赖外部字体或地图瓦片。

## GitHub Pages 部署

仓库：https://github.com/huyarufitor/history-atlas

网站地址：https://huyarufitor.github.io/history-atlas/

`.github/workflows/deploy.yml` 在推送到 `master` 时自动执行安装、lint、测试、类型检查和构建，再发布 `dist`。也可以在 Actions 页面手动运行。仓库的 Settings → Pages → Source 需要选择 GitHub Actions。

部署构建命令为 `pnpm build --base=/history-atlas/`。网页资源、地图数据和资料链接均使用这个站点前缀，本地开发仍使用根路径 `/`。

以后如更改仓库名称，需要同步修改构建命令里的前缀；绑定指向站点根目录的自定义域名时改为 `--base=/`，并在 Pages 设置和域名服务商处配置域名。

## 准确性优先

用户已选择优先考证历史国界。当前为可运行的资料探索和核查基础，**不是已完成独立考证的全球精确地图**。所有640条来源记录保持未复核状态；可按具体日期检索、查看历次边界版本及原始数据行号。详细发现、资料缺口、德国／苏联考证清单见 `docs/research/2026-10-14-source-audit.md`。

CShapes说明文档记录了小面积变化省略、部分日期占位和现代边界回溯等限制，因此逐日筛选不能等同于逐日准确。

## 功能

- 年份时间轴、逐年播放、具体日期选择、年份输入及键盘快捷键。
- 地区历次边界记录、原始行号、几何版本、来源核查台账与缺失年份。
- 世界地图、区域聚焦、拖动和缩放、当前日期的国家或地区搜索。
- 17个历史专题及事件前后对比：德意志帝国终结、德国统一、苏联成立与解体、奥匈帝国瓦解、印巴分治、非洲独立、南苏丹独立等。
- 每个专题显示实际快照日期、历史解释和外部参考资料。
- 中文主要地区名称、响应式移动端、数据加载重试及弹窗键盘操作。

## 真实覆盖范围与历史口径

时间轴可选择1900—2026年，但当前边界数据来自 CShapes 2.0，**仅覆盖至2019-12-31**。2020—2026年不绘制国界，并醒目标记“边界数据待补充”，不把2019年数据外推为后续年份。

该版本是可运行的历史地图第一版，尚未完整考证1900—2026年所有国界变化与事件。CShapes采用GW政治实体编码，不是完整的主权国家列表或每日军事控制线，部分小国不在其中。属地、争议区域、独立日期与边界日期可能不同。例如德国1918年结束帝制时，轮廓不会立即改变；苏联解体专题对比1991年初和年末，而非把整个过程压缩到一天。

争议地区遵循数据源编码（例如2014年的克里米亚），不表示主权归属判断。国家名称中文注释独立于几何数据，未翻译的历史属地保留原名；扩充名称可修改 `src/history.ts`。

## 数据来源和许可

[CShapes 2.0 · ETH Zurich](https://icr.ethz.ch/data/cshapes/)，Schvitz et al. (2022)。

**地图数据为 CC BY-NC-SA 4.0，限非商业用途；分享改编数据需署名并沿用同一许可。** 详见 `public/data/ATTRIBUTION.md`。商业上线前需要另行取得许可或替换为允许商业使用的数据。

本地数据于2026-10-14下载，保留了640条有效边界记录。预处理只整理字段、精确读取年月日、保留全部原始坐标精度，并适配D3的环方向；未推测未知国界。原始文件哈希与修改说明见 `public/data/provenance.json`。

如需重新生成：

```sh
curl --fail --location https://icr.ethz.ch/data/cshapes/CShapes-2.0.geojson -o data/cshapes-original.geojson
pnpm data:prepare
```

## 验证

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

单元测试检查时间边界、名称切换、真实德国／苏联／南苏丹变化、多边形方向和所有年份的记录唯一性。浏览器测试检查实际地图切换、搜索、播放、加载重试、手机布局和弹窗焦点。

## 项目结构

- `src/App.vue`：页面、历史时间与专题交互。
- `src/WorldMap.vue`：地图投影、SVG绘制、缩放与拖动。
- `src/history.ts`：日期逻辑、数据类型与中文名称。
- `src/events.ts`：事件、对比日期及资料来源。
- `scripts/prepare-data.mjs`：可复现的数据预处理。
- `public/data/`：地图数据、署名与来源记录。
- `tests/` / `e2e/`：数据与浏览器验证。

技术依赖仅 Vue 3 与 d3-geo；没有引入地图服务、状态管理或组件库。
