'use strict';

const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const TemplateManager = require("./template-manager");

// ------------------------------------------------------------
// 1. Activation
// ------------------------------------------------------------

function activate(context) {
    try {
        const templateManager = new TemplateManager(context);

        registerTemplateSelection(context, templateManager);
        registerExportCommands(context, templateManager);

    } catch (err) {
        console.error("Activation failed:", err);
        vscode.window.showErrorMessage("Activation failed: " + err.message);
    }
}

exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;

// ------------------------------------------------------------
// 2. Command Registration
// ------------------------------------------------------------

function registerTemplateSelection(context, templateManager) {
    const disposable = vscode.commands.registerCommand(
        "latex-markdown-compiler.selectTemplate",
        () => selectTemplate(context, templateManager)
    );
    context.subscriptions.push(disposable);
}

function registerExportCommands(context, templateManager) {
    const formats = ["pdf", "html", "png", "jpeg"];

    for (const format of formats) {
        const commandId = `latex-markdown-compiler.export${format.charAt(0).toUpperCase() + format.slice(1)}`;

        const disposable = vscode.commands.registerCommand(
            commandId,
            (inputUri) => exportSingleFormat(format, inputUri, context, templateManager)
        );

        context.subscriptions.push(disposable);
    }
}

// ------------------------------------------------------------
// 3. Template Selection
// ------------------------------------------------------------

async function selectTemplate(context, templateManager) {
    const templates = templateManager.getAllTemplates();

    const currentSelection =
        context.globalState.get("latexMarkdownCompiler.selectedTemplate") ||
        "System Light";

    const items = templates.map((t) => ({
        label: t.name,
        description: t.description || "",
        detail: t.name === currentSelection ? "✓ Currently Selected" : ""
    }));

    const choice = await vscode.window.showQuickPick(items, {
        placeHolder: "Select a rendering template",
        matchOnDescription: true,
        matchOnDetail: true
    });

    if (!choice) return;

    if (choice.label !== currentSelection) {
        await context.globalState.update(
            "latexMarkdownCompiler.selectedTemplate",
            choice.label
        );

        vscode.window.showInformationMessage(`Template set to: ${choice.label}`);
    }
}

// ------------------------------------------------------------
// 4. Export Pipeline
// ------------------------------------------------------------

async function exportSingleFormat(format, inputUri, context, templateManager) {
    try {
        const targetUri = inputUri || vscode.window.activeTextEditor?.document.uri;
        if (!targetUri) return showError("No file selected");

        const markdownSource = await resolveMarkdownSource(targetUri);
        if (!markdownSource) return;

        const renderedHtml = await vscode.commands.executeCommand(
            "markdown.api.render",
            markdownSource,
            targetUri
        );

        const selectedTemplate =
            context.globalState.get("latexMarkdownCompiler.selectedTemplate") ||
            "System Light";

        const combinedCss = templateManager.buildFullDocument(selectedTemplate);

        const katexCssUri = getKatexCssUri(context);
        const finalHtml = buildFinalHtml(renderedHtml, katexCssUri, combinedCss);

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Exporting ${format.toUpperCase()}...`
            },
            async () => {
                switch (format) {
                    case "pdf": return exportPdf(finalHtml, targetUri, templateManager, selectedTemplate);
                    case "html": return exportHtml(finalHtml, targetUri);
                    case "png": return exportPng(finalHtml, targetUri);
                    case "jpeg": return exportJpeg(finalHtml, targetUri);
                }
            }
        );

        vscode.window.showInformationMessage(`${format.toUpperCase()} export complete!`);

    } catch (err) {
        showError("Export failed", err);
    }
}

async function resolveMarkdownSource(targetUri) {
    const editor = vscode.window.activeTextEditor;

    if (editor && editor.document.uri.fsPath === targetUri.fsPath) {
        if (editor.document.languageId !== "markdown") {
            return showError("Active file is not Markdown");
        }
        return editor.document.getText();
    }

    if (!targetUri.fsPath.toLowerCase().endsWith(".md")) {
        return showError("Selected file is not Markdown");
    }

    return fs.readFileSync(targetUri.fsPath, "utf8");
}

// ------------------------------------------------------------
// 5. HTML Builder
// ------------------------------------------------------------

function buildFinalHtml(renderedHtml, katexCssUri, combinedCss) {
    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="stylesheet" href="${katexCssUri}">
<style>
${combinedCss}
</style>
</head>
<body>
${renderedHtml}
</body>
</html>
`;
}

function getKatexCssUri(context) {
    const katexCssPath = path.join(context.extensionPath, "media", "katex", "katex.min.css");
    return `file://${katexCssPath.replace(/\\/g, "/")}`;
}

// ------------------------------------------------------------
// 6. Exporters
// ------------------------------------------------------------

async function exportHtml(html, targetUri) {
    const outPath = targetUri.fsPath.replace(/\.md$/, ".html");
    fs.writeFileSync(outPath, html, "utf8");
}

async function exportPdf(html, targetUri, templateManager, templateName) {
    await runPuppeteer(html, targetUri, async (page, outPath) => {

        const margins = templateManager.getPdfMargins(templateName);

        await page.pdf({
            path: outPath,
            printBackground: true,
            format: "A4",
            margin: {
                top: margins.top,
                bottom: margins.bottom,
                left: margins.left,
                right: margins.right
            },
            displayHeaderFooter: true,
            headerTemplate: `
                <div style="
                    font-size:12px;
                    width:100%;
                    padding:0 0.5in;
                    display:flex;
                    justify-content:space-between;
                    color:#555;
                ">
                    <span>${path.basename(targetUri.fsPath)}</span>
                    <span>${new Date().toISOString().split("T")[0]}</span>
                </div>
            `,
            footerTemplate: `
                <div style="
                    font-size:12px;
                    width:100%;
                    text-align:center;
                    padding:0 0.5in;
                    color:#555;
                ">
                    <span class="pageNumber"></span> / 
                    <span class="totalPages"></span>
                </div>
            `
        });

    }, ".pdf");
}

async function exportPng(html, targetUri) {
    await runPuppeteer(html, targetUri, async (page, outPath) => {
        await page.screenshot({ path: outPath, fullPage: true });
    }, ".png");
}

async function exportJpeg(html, targetUri) {
    await runPuppeteer(html, targetUri, async (page, outPath) => {
        await page.screenshot({
            path: outPath,
            type: "jpeg",
            quality: 90,
            fullPage: true
        });
    }, ".jpeg");
}

async function runPuppeteer(html, targetUri, action, extension) {
    const puppeteer = require("puppeteer-core");
    const chromePath = findChrome();

    if (!chromePath) {
        return showError("Chrome not found");
    }

    const tmpPath = targetUri.fsPath.replace(/\.md$/i, "_tmp.html");
    const outPath = targetUri.fsPath.replace(/\.md$/i, extension);

    fs.writeFileSync(tmpPath, html, "utf8");

    let browser;

    try {
        browser = await puppeteer.launch({
            executablePath: chromePath,
            args: ["--no-sandbox"]
        });

        const page = await browser.newPage();
        await page.goto(vscode.Uri.file(tmpPath).toString(), {
            waitUntil: "networkidle0"
        });

        await action(page, outPath);

    } finally {
        if (browser) {
            await browser.close();
        }

        if (fs.existsSync(tmpPath)) {
            fs.unlinkSync(tmpPath);
        }
    }
}

// ------------------------------------------------------------
// 7. Utilities
// ------------------------------------------------------------

function findChrome() {
    const platform = process.platform;

    if (platform === "win32") {
        const possiblePaths = [
            path.join(process.env.LOCALAPPDATA || "", "BraveSoftware", "Brave-Browser", "Application", "brave.exe"),
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
        ];
        return possiblePaths.find(fs.existsSync) || null;
    }

    if (platform === "darwin") {
        const macPath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
        return fs.existsSync(macPath) ? macPath : null;
    }

    if (platform === "linux") {
        const linuxPaths = ["/usr/bin/google-chrome", "/usr/bin/chromium-browser"];
        return linuxPaths.find(fs.existsSync) || null;
    }

    return null;
}

function showError(message, error) {
    console.error(message, error || "");
    vscode.window.showErrorMessage(error ? `${message}: ${error.message}` : message);
}