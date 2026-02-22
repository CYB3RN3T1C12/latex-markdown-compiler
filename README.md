# LaTeX Markdown Compiler

A powerful VS Code extension that compiles Markdown with LaTeX support into fully styled HTML and PDF documents using a modular template architecture and headless Chrome rendering.

---

## 🚀 Overview

LaTeX Markdown Compiler transforms Markdown files into professionally styled documents with:

- Full LaTeX math support (KaTeX)
- Modular JSON-driven theme system
- Syntax highlighting templates
- Light / Dark system themes
- High-quality PDF export via Puppeteer
- Clean architecture for extensibility

This extension is designed for both end users and developers who want customizable document rendering.

---

## ✨ Features

- ✅ Markdown to styled HTML rendering
- ✅ Inline and block LaTeX math support
- ✅ KaTeX-based math rendering
- ✅ Modular template system (JSON → CSS → Full HTML)
- ✅ Syntax theme support (VS Code Dark/Light, Tomorrow)
- ✅ System theme switching
- ✅ High-quality PDF export via headless Chrome
- ✅ Clean extension architecture for contributors

---

## 🏗 Architecture

Rendering Flow:
Template JSON
↓
template-manager.js
↓
Generates CSS + Full HTML
↓
extension.js
↓
Puppeteer renders final document
↓
HTML / PDF output


### Core Components

**extension.js**
- Registers VS Code commands
- Coordinates document export
- Launches Puppeteer for PDF rendering

**template-manager.js**
- Loads system, math, and syntax templates
- Converts JSON theme definitions into CSS
- Builds final HTML document structure

**templates/**
- `system/` → Light/Dark layout themes
- `syntax/` → Code highlighting themes
- `math/` → KaTeX adjustments and styling

This modular architecture allows easy theme creation and extension.

---

## 📦 Requirements

- VS Code
- Google Chrome (for automated PDF export)
- Node.js (for development)

---

## 🛠 Installation (Development)

Clone the repository:
git clone https://github.com/CYB3RN3T1C12/latex-markdown-compiler.git

Install dependencies:
npm install


Run extension in development mode:

- Open project in VS Code
- Press `F5`
- Launch Extension Development Host

---

## 📄 Usage

1. Open a Markdown file
2. Run the command to export:
   LaTeX Markdown Compiler: Export PDF/HTML/PNG/JPEG
3. Run the command to change the template:
   LaTeX Markdown Compiler: Select Template
---

## 🎨 Custom Templates

Themes are defined in JSON files located in:
templates/

You can create new themes by:

- Duplicating a JSON template
- Modifying color definitions
- Adding new CSS rules via template-manager

---

## 🧪 Testing

Run tests:
npm test

---

## 🗺 Roadmap

- Live preview webview editor
- Template visual editor
- Custom user template configuration
- Marketplace publishing
- Performance optimization
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

Built with ❤️ for Markdown + LaTeX workflows.
