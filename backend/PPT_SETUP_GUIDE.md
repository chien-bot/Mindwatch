# PPT 真实转换功能设置指南

## ✅ 已完成的工作

我已经帮你实现了真实的 PPT/PDF 转图片功能！现在你的应用可以：

1. ✅ 上传 PDF、PPT、PPTX 文件
2. ✅ 自动将每页转换为高清图片（PNG 格式，200 DPI）
3. ✅ 提取每页的文字内容
4. ✅ 保存图片到静态文件目录
5. ✅ 提供图片 URL 给前端显示

---

## 📦 安装的依赖

已在虚拟环境中安装以下 Python 包：

```bash
pdf2image==1.17.0      # PDF 转图片
python-pptx==0.6.23    # 读取 PPTX 文件
Pillow==12.0.0         # 图片处理
PyPDF2==3.0.1          # PDF 文本提取
```

---

## 🔧 系统要求

### ⚠️ 重要：需要安装 poppler（PDF 渲染引擎）

`pdf2image` 依赖于 `poppler-utils` 来转换 PDF。你需要在你的系统上安装它：

### macOS 安装：
```bash
brew install poppler
```

### Ubuntu/Debian 安装：
```bash
sudo apt-get install poppler-utils
```

### Windows 安装：
1. 下载 poppler for Windows: https://github.com/oschwartz10612/poppler-windows/releases
2. 解压到 `C:\poppler`
3. 将 `C:\poppler\Library\bin` 添加到系统 PATH

---

## 📁 文件结构

```
backend/
├── uploads/              # 上传的原始文件（自动创建）
├── static/               # 转换后的图片（自动创建）
│   └── <presentation_id>/
│       ├── slide_1.png
│       ├── slide_2.png
│       └── slide_3.png
└── app/
    ├── services/
    │   └── ppt_processor.py  # 新增：PPT 处理服务
    └── api/v1/
        └── ppt.py            # 更新：使用真实处理
```

---

## 🚀 如何使用

### 1. 启动后端（在虚拟环境中）

```bash
cd /Users/yaphowchien/speakmate/backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### 2. 测试上传 API

使用 curl 测试上传功能：

```bash
curl -X POST http://localhost:8000/api/v1/ppt/upload \
  -F "file=@/path/to/your/presentation.pdf"
```

或者在前端直接上传（已集成）：
- 访问 http://localhost:3000/practice/ppt
- 点击"选择文件"
- 上传你的 PDF 或 PPTX 文件

### 3. 查看转换结果

上传成功后，图片会保存在：
```
backend/static/<presentation_id>/slide_1.png
backend/static/<presentation_id>/slide_2.png
...
```

可以通过浏览器访问：
```
http://localhost:8000/static/<presentation_id>/slide_1.png
```

---

## 🔄 处理流程

```
用户上传 PPT/PDF
    ↓
保存到 uploads/ 目录
    ↓
判断文件类型 (PDF/PPTX/PPT)
    ↓
┌─────────────────────┬─────────────────────┐
│   PDF 文件          │   PPTX/PPT 文件     │
│ 1. pdf2image 转图片  │ 1. 先转为 PDF       │
│ 2. PyPDF2 提取文字   │ 2. python-pptx 提取 │
└─────────────────────┴─────────────────────┘
    ↓
保存图片到 static/<id>/
    ↓
返回图片 URL 和文字内容给前端
```

---

## 📝 代码说明

### 主要文件

#### 1. `app/services/ppt_processor.py`
PPT 处理核心逻辑：

```python
class PPTProcessor:
    def process_file(self, file_path, file_type):
        """处理 PDF/PPT/PPTX 文件"""
        if file_type == 'pdf':
            return self._process_pdf(file_path)
        elif file_type in ['ppt', 'pptx']:
            return self._process_pptx(file_path)
```

主要功能：
- PDF 转图片（200 DPI）
- 提取文本内容
- 保存为 PNG 格式

#### 2. `app/api/v1/ppt.py`
更新后的上传 API：

```python
@router.post("/upload")
async def upload_ppt(file: UploadFile):
    # 1. 验证文件类型和大小
    # 2. 保存上传文件
    # 3. 使用 PPTProcessor 处理
    # 4. 返回图片 URL 和文本
```

---

## ⚙️ 配置选项

在 `app/core/config.py` 中：

```python
UPLOAD_DIR: str = "uploads"    # 上传目录
STATIC_DIR: str = "static"     # 静态文件目录
```

可以通过环境变量覆盖：
```bash
export UPLOAD_DIR="/custom/upload/path"
export STATIC_DIR="/custom/static/path"
```

---

## 🐛 常见问题

### 1. 报错：`pdf2image requires poppler`

**解决方案：**
```bash
brew install poppler  # macOS
```

### 2. PPTX 转换失败

**原因：** 需要 LibreOffice 将 PPTX 转为 PDF

**解决方案（可选）：**
```bash
# macOS
brew install --cask libreoffice

# Ubuntu
sudo apt-get install libreoffice
```

如果不安装 LibreOffice，建议用户先将 PPTX 导出为 PDF 再上传。

### 3. 图片不显示

**检查：**
1. 确认 `static/` 目录已创建
2. 检查图片 URL 是否正确：`http://localhost:8000/static/<id>/slide_X.png`
3. 查看后端日志是否有错误

---

## 📊 性能优化

### 当前配置
- DPI: 200（高清）
- 格式: PNG（无损）
- 文件大小限制: 50MB

### 如果需要优化速度
可以在 `ppt_processor.py` 中调整：

```python
# 降低 DPI（更快但质量较低）
images = convert_from_path(pdf_path, dpi=150)  # 从 200 改为 150

# 或使用 JPEG（文件更小）
image.save(str(image_path), 'JPEG', quality=85)
```

---

## 🔐 生产环境建议

在生产环境中，建议：

1. **使用云存储** - 将图片上传到 S3/OSS，而不是本地存储
2. **异步处理** - 使用 Celery 或其他任务队列处理大文件
3. **添加数据库** - 存储演示文稿元数据
4. **文件清理** - 定期清理旧文件
5. **安全验证** - 添加文件内容验证，防止恶意上传

---

## ✨ 下一步建议

可以进一步添加的功能：

1. **缩略图生成** - 生成小尺寸预览图
2. **OCR 支持** - 对图片型 PDF 使用 OCR 提取文字
3. **批量上传** - 支持一次上传多个文件
4. **进度显示** - 大文件上传时显示转换进度
5. **格式支持** - 支持 Keynote、Google Slides 等

---

## 📞 测试命令

```bash
# 1. 检查 poppler 是否安装
pdftoppm -h

# 2. 测试后端健康
curl http://localhost:8000/api/health

# 3. 测试上传
curl -X POST http://localhost:8000/api/v1/ppt/upload \
  -F "file=@test.pdf"

# 4. 查看静态文件
ls -la backend/static/
```

---

**现在你可以上传真实的 PPT/PDF 文件了！** 🎉
