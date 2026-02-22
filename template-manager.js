// ------------------------------------------------------------
// TemplateManager
// Responsible for loading templates, syntax themes, and
// generating final CSS (layout + syntax + math fixes).
// ------------------------------------------------------------

const fs = require("fs");
const path = require("path");

class TemplateManager {

    // ------------------------------------------------------------
    // 1. Constructor
    // ------------------------------------------------------------
    constructor(context) {
        this.context = context;

        this.templatesPath = path.join(context.extensionPath, "templates");

        this.systemDir = path.join(this.templatesPath, "system");
        this.customDir = path.join(this.templatesPath, "custom");
        this.syntaxDir = path.join(this.templatesPath, "syntax");
        this.mathFixesPath = path.join(this.templatesPath, "math", "katex-fixes.css");
    }


    // ------------------------------------------------------------
    // 2. JSON Loading Helpers
    // ------------------------------------------------------------

    // Load a JSON file safely
    loadJson(filePath) {
        try {
            return JSON.parse(fs.readFileSync(filePath, "utf8"));
        } catch (err) {
            console.error("Failed to load JSON:", filePath, err);
            throw new Error(`Invalid JSON in ${path.basename(filePath)}`);
        }
    }


    // ------------------------------------------------------------
    // 3. Template Loading
    // ------------------------------------------------------------

    // Load all system + custom templates
    getAllTemplates() {
        const templates = [];

        // Load system templates
        if (fs.existsSync(this.systemDir)) {
            const systemFiles = fs.readdirSync(this.systemDir)
                .filter(file => file.endsWith(".json"));

            for (const file of systemFiles) {
                const data = this.loadJson(path.join(this.systemDir, file));
                templates.push({
                    name: data.name || file.replace(".json", ""),
                    description: data.description || "",
                    type: "system",
                    data
                });
            }
        }

        // Load custom templates
        if (fs.existsSync(this.customDir)) {
            const customFiles = fs.readdirSync(this.customDir)
                .filter(file => file.endsWith(".json"));

            for (const file of customFiles) {
                const data = this.loadJson(path.join(this.customDir, file));
                templates.push({
                    name: data.name || file.replace(".json", ""),
                    description: data.description || "",
                    type: "custom",
                    data
                });
            }
        }

        return templates;
    }

    // Load a specific template by name
    loadTemplate(templateName) {
        const allTemplates = this.getAllTemplates();
        const match = allTemplates.find(t => t.name === templateName);
        return match ? match.data : null;
    }


    // ------------------------------------------------------------
    // 4. Syntax Theme Loading
    // ------------------------------------------------------------

    // Load syntax theme JSON by name
    loadSyntaxTheme(themeName) {
        const filePath = path.join(this.syntaxDir, `${themeName}.json`);
        return this.loadJson(filePath);
    }

    // Convert syntax JSON → CSS rules
    syntaxJsonToCss(json) {
        return Object.entries(json)
            .map(([selector, rules]) => {

                // If the rule is a string, treat it as a color
                if (typeof rules === "string") {
                    return `${selector} { color: ${rules}; }`;
                }

                // Otherwise treat it as an object of CSS properties
                const body = Object.entries(rules)
                    .map(([prop, value]) => `${prop}: ${value};`)
                    .join("");

                return `${selector} { ${body} }`;
            })
            .join("\n");
    }


    // ------------------------------------------------------------
    // 5. Template → CSS Conversion
    // ------------------------------------------------------------

    buildHeaderCss(tag, config) {
        if (!config) return "";

        return `
            ${tag} {
                font-size: ${config.size};
                font-weight: ${config.weight};
                margin-top: ${config.marginTop};
                ${config.paddingBottom ? `padding-bottom: ${config.paddingBottom};` : ""}
                ${config.borderBottom ? `border-bottom: ${config.borderBottom};` : ""}
                ${config.color ? `color: ${config.color};` : ""}
            }
        `;
    }

    // Convert a template JSON object into layout CSS
    templateToCss(template) {

        const t = template;

        const body = t.typography?.body || {};
        const headers = t.typography?.headers || {};
        const layout = t.layout || {};

        return `
            body {
                font-family: ${body.font};
                font-size: ${body.size};
                font-weight: ${body.weight};
                line-height: ${body.lineHeight};
                letter-spacing: ${body.letterSpacing};
                color: ${body.color};
                background: ${layout.pageBackground};
            }

            p {
                margin-top: ${body.paragraphSpacingTop};
                margin-bottom: ${body.paragraphSpacingBottom};
            }

            ${this.buildHeaderCss("h1", headers.h1)}
            ${this.buildHeaderCss("h2", headers.h2)}
            ${this.buildHeaderCss("h3", headers.h3)}
            ${this.buildHeaderCss("h4", headers.h4)}
            ${this.buildHeaderCss("h5", headers.h5)}
            ${this.buildHeaderCss("h6", headers.h6)}

            ul, ol {
                padding-left: ${t.lists.indent};
            }

            ul li, ol li {
                margin: ${t.lists.itemSpacing} 0;
            }

            hr {
                border: none;
                border-top: 0.08em solid ${layout.horizontalRuleColor};
                margin: 1.5em 0;
            }

            blockquote {
                background: ${layout.blockquoteBackground};
                border-left: 0.25em solid ${layout.blockquoteBorder};
                padding-left: 1em;
                margin: 1em 0;
            }

            pre {
                background: ${t.code.background};
                border: ${t.code.border};
                border-radius: ${t.code.radius};
                padding: ${t.code.padding};
                overflow-x: auto;
                white-space: pre-wrap;
                overflow-wrap: break-word;
            }

            :not(pre):not(.hljs) > code {
                color: ${t.code.inlineColor};
            }

            table {
                border-collapse: collapse;
            }

            table > thead > tr > th {
                text-align: left;
                border-bottom: ${t.tables.headerBorder};
            }

            table > thead > tr > th,
            table > tbody > tr > td {
                padding: ${t.tables.cellPadding};
            }

            table > tbody > tr + tr > td {
                border-top: ${t.tables.rowBorder};
            }
        `;
    }


    getPdfMargins(templateName) {
        const template = this.loadTemplate(templateName);
        if (!template) {
            throw new Error("Template not found: " + templateName);
        }

        const layout = template.layout || {};

        return {
            top: layout.marginTop || "1in",
            right: layout.marginRight || "1in",
            bottom: layout.marginBottom || "1in",
            left: layout.marginLeft || "1in"
        };
    }


    // Build CSS directly from a template object (no disk load)
    buildCssFromTemplateObject(template) {
        return this._assembleCss(template);
    }

    _assembleCss(template) {

        const syntaxTheme = this.loadSyntaxTheme(template.code.syntaxTheme);
        const mathFixesCss = fs.readFileSync(this.mathFixesPath, "utf8");

        const layoutCss = this.templateToCss(template);
        const syntaxCss = this.syntaxJsonToCss(syntaxTheme);

        return `${layoutCss}\n${syntaxCss}\n${mathFixesCss}`;
    }

    // Build final CSS from template name
    buildFullDocument(templateName) {
        const template = this.loadTemplate(templateName);
        if (!template) {
            throw new Error("Template not found: " + templateName);
        }
        return this._assembleCss(template);
    }
}

module.exports = TemplateManager;