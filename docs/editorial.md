# 文学书页设计与素材

用户选择方案 ①，按既有个人主页内容改版。保留双鱼标识、小法师、真实作品、简历、联系方式与深浅主题；移除星图渲染与重点作品区块。原生 HTML/CSS/JavaScript，不引入运行时依赖。

设计参数：构图变化 6/10、动态强度 3/10、信息密度 3/10。书刊式宋体来自文学背景和选定效果图；配色为纸白、墨蓝、朱红。照片式艺术素材与可访问的 HTML 内容分离。

## 手机

- 标题两行，介绍和操作入口先于艺术素材。
- 手机加载 960 × 320 的 WebP（12,260 字节），独立设置展示比例和裁切；桌面加载 1920 × 640 的 WebP（42,716 字节）。
- 首屏快捷入口两列、最多 4 件，完整目录容纳全部产品。
- 主操作、菜单、主题与目录入口最小点击高度 44px。
- 不绑定触摸拖拽，不使用陀螺仪，不运行持续动画；减少动态效果时取消入场和透视反馈。
- `Literary Serif` 是 Noto Serif SC 的 400–600 字重子集，自托管约 47 KB，OFL 授权保留在 `assets/fonts/OFL.txt`。新产品的未包含字形使用系统宋体回退。

## 素材

使用内置 imagegen 工具，以用户选定的首屏效果图为参考，生成独立纸卷图片。没有将整张效果图当成网页。生产资产：

- `assets/editorial/paper-1920.webp`
- `assets/editorial/paper-960.webp`

仅做等比例缩放与 WebP 编码。纸张的立体质感来自生成图像；桌面指针反馈是 CSS 平面透视，不宣称为可自由旋转的三维纸张模型。

最终生成提示词：

> Edit the reference into a production WEBSITE ART ASSET ONLY. Extract/recreate only the beautiful continuous undulating ivory paper strip seen in the middle of the reference. Keep its flowing folded-paper sculptural shape, matte fine paper grain, subtle hand-painted Chinese ink mountains and delicate branch drawings, warm natural studio lighting and gentle soft contact shadows. Remove ALL website UI, ALL typography, ALL words and calligraphy, titles, navigation, buttons, product names, wizard and fish logos. No text whatsoever. A single wide flowing paper strip spanning almost entire image horizontally, elegant and natural like reference with large curved fold rising around right-center, left edge slightly curling under. Paper should occupy middle 80% of image height, minimal surrounding empty space. Camera same slight elevated frontal perspective as reference. Background and floor perfectly uniform warm off-white RGB 245 242 235 (#F5F2EB), with soft realistic shadows under paper, no horizon line, no vignette, no extra props. Wide landscape aspect about 3:1 if possible. Need photoreal tactile fine-art asset retaining refined Chinese literary mood of chosen reference. NOT a website screenshot. No text.

## 验证范围

验证 320、375、390、430、768、1024、1440 像素布局；目录筛选、新增产品、作品入口、主题保存、菜单焦点、键盘、证书、无 JavaScript、减少动态效果与 200% 缩放。手机浏览器设备模拟不等同于实体手机测试。
