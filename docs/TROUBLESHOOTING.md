# 故障排除指南

## 问题：字幕没有被处理

### 快速修复步骤

1. **使用修复版本：**
   ```bash
   mv manifest.json manifest-original.json
   mv manifest-fixed.json manifest.json
   ```

2. **重新加载扩展：**
   - 去 `chrome://extensions/`
   - 点击扩展的刷新按钮
   - 或者删除后重新"加载未打包"

3. **测试步骤：**
   - 打开YouTube
   - 播放英文视频并开启字幕
   - 应该看到右上角出现"🎧 ELA Active"提示
   - 字幕应该被过滤（一些词变成"___"）

### 调试检查清单

#### ✅ 基础检查
- [ ] 扩展已加载且无错误
- [ ] 已进行词汇量评估
- [ ] YouTube视频确实有英文字幕
- [ ] 右上角出现了"🎧 ELA Active"指示器

#### ✅ 控制台检查
打开开发者工具（F12），在Console标签中查找：

**应该看到的日志：**
```
🎧 ELA: YouTube script starting...
🎧 ELA: YouTube manager constructed
🎧 ELA: Initializing YouTube manager
🎧 ELA: Settings loaded: {vocabularyLevel: 1000, ...}
🎧 ELA: Starting to watch for subtitles
🎧 ELA: Setting up subtitle monitoring
🎧 ELA: Starting subtitle polling
```

**字幕检测时应该看到：**
```
🎧 ELA: Subtitle detected: [字幕文本] using selector: .ytp-caption-segment
🎧 ELA: Processing subtitle: [字幕文本]
🎧 ELA: Extracted words: [单词数组]
🎧 ELA: Unknown words: [生词数组]
🎧 ELA: Showing filtered subtitle
🎧 ELA: Custom subtitle added to page
```

#### ❌ 常见错误和解决方案

**错误1：没有看到任何ELA日志**
- 原因：内容脚本未注入
- 解决：检查manifest.json语法，重新加载扩展

**错误2：看到初始化日志但没有字幕检测**
- 原因：YouTube字幕选择器可能已更改
- 解决：使用修复版本（youtube-fixed.js）

**错误3：权限错误**
```
Access to fetch at 'chrome-extension://...' from origin 'https://www.youtube.com' has been blocked
```
- 解决：检查manifest.json中的web_accessible_resources配置

**错误4：字幕检测到但没有过滤效果**
- 原因：CSS样式未加载或被覆盖
- 解决：检查styles/overlay.css是否正确加载

### 测试用的YouTube视频推荐

使用有清晰英文字幕的教育类视频：
- TED Talks（有准确字幕）
- Khan Academy英文视频
- BBC Learning English
- Crash Course系列

### 手动测试方法

如果自动检测不工作，可以在控制台手动测试：

```javascript
// 检查字幕元素
document.querySelectorAll('.ytp-caption-segment')

// 检查字幕容器
document.querySelector('.ytp-caption-window-container')

// 手动触发字幕检测
if (window.manager) {
    window.manager.checkForSubtitles();
}
```

### 高级调试

#### 监控YouTube页面结构
YouTube经常更新其HTML结构。检查当前字幕元素：

```javascript
// 在控制台运行，查找所有可能的字幕元素
const possibleSelectors = [
    '.ytp-caption-segment',
    '.captions-text', 
    '.ytp-caption-window-container span',
    '.html5-captions-text',
    '[class*="caption"]',
    '[class*="subtitle"]'
];

possibleSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
        console.log('找到字幕元素:', selector, elements);
    }
});
```

#### 检查扩展权限
确保扩展有足够的权限：

```javascript
// 检查权限
chrome.permissions.getAll((permissions) => {
    console.log('当前权限:', permissions);
});
```

### 恢复原始版本

如果修复版本有问题，恢复原始版本：

```bash
mv manifest.json manifest-fixed-backup.json
mv manifest-original.json manifest.json
```

### 联系支持

如果问题仍然存在，请提供：
1. Chrome版本
2. 控制台的完整错误日志
3. 测试的YouTube视频链接
4. manifest.json的内容

### 已知限制

1. 某些YouTube页面加载方式可能导致脚本注入延迟
2. 广告播放期间字幕检测可能暂停
3. 某些视频的自动生成字幕可能不被检测
4. 快速切换视频可能需要几秒钟重新初始化