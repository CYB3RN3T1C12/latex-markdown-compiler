# LaTeX Markdown Compiler

A powerful VS Code extension that compiles Markdown with LaTeX support into fully styled HTML, PDF, PNG, and JPEG documents using a modular template architecture and headless Chrome rendering.

---

## 🚀 Overview

LaTeX Markdown Compiler transforms Markdown files into professionally styled documents with:

- Full LaTeX math support (KaTeX)
- Modular JSON-driven theme system
- Syntax highlighting templates
- Light / Dark system themes
- High-quality PDF export via Puppeteer
- Image export (PNG / JPEG)
- Clean architecture for extensibility

Designed for both end users and developers who want customizable document rendering.

---

## ✨ Features

- ✅ Markdown to styled HTML rendering  
- ✅ Inline and block LaTeX math support  
- ✅ KaTeX-based math rendering  
- ✅ Modular template system (JSON → CSS → Full HTML)  
- ✅ Syntax theme support (VS Code Dark/Light, Tomorrow)  
- ✅ System theme switching  
- ✅ Export to HTML, PDF, PNG, JPEG  
- ✅ High-quality rendering via headless Chrome  
- ✅ Clean architecture for contributors  

---

## 🏗 Architecture

### Rendering Flow

```
Template JSON
      ↓
template-manager.js
      ↓
Generates CSS + Full HTML
      ↓
extension.js
      ↓
Puppeteer (Headless Chrome)
      ↓
HTML / PDF / Image output
```

### Core Components

**extension.js**
- Registers VS Code commands
- Coordinates document export
- Launches Puppeteer for rendering

**template-manager.js**
- Loads system, math, and syntax templates
- Converts JSON theme definitions into CSS
- Builds final HTML document structure

**templates/**
- `system/` → Layout themes (Light/Dark)
- `syntax/` → Code highlighting themes
- `math/` → KaTeX styling adjustments

This modular architecture allows easy theme creation and extension.

---

## 📦 Requirements

- VS Code
- Google Chrome (required for automated PDF and image export)
- Node.js (for development)

> Chrome must be installed locally for Puppeteer-based export to function.

---

## 🛠 Installation (Development)

Clone the repository:

```bash
git clone https://github.com/CYB3RN3T1C12/latex-markdown-compiler.git
```

Install dependencies:

```bash
npm install
```

Run extension in development mode:

- Open project in VS Code
- Press `F5`
- Launch Extension Development Host

---

## 📄 Usage

1. Open a Markdown file  
2. Run:

```
LaTeX Markdown Compiler: Export PDF/HTML/PNG/JPEG
```

3. To switch templates:

```
LaTeX Markdown Compiler: Select Template
```

---

## 🎨 Custom Templates

Themes are defined in:

```
templates/
```

To create a new theme:

- Duplicate a JSON template
- Modify color definitions
- Extend styling via `template-manager.js`

---

## 🧪 Testing

Run:

```bash
npm test
```

---

## 🗺 Roadmap

- Live preview webview editor  
- Template visual editor  
- User-configurable templates  
- Performance optimization  
- Marketplace publishing automation  
- Plugin system for additional renderers  

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository  
2. Create a feature branch  
3. Submit a pull request  

Please open an issue before major architectural changes.

---

## 📜 License

MIT License

---

Built for powerful Markdown + LaTeX workflows inside VS Code.
