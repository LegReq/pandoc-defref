/* eslint-disable no-console -- Console application. */

import type * as fs from "node:fs";
import pandoc from "pandoc-filter";

/**
 * Definition, composed of the term being defined, the title (hover text), and whether it is referenced in the document.
 */
interface Definition {
    /**
     * Term as it appears in the definition list.
     */
    term: string;

    /**
     * Title (hover text), the first normal paragraph in the definition.
     */
    title: string | undefined;

    /**
     * Flag to indicate that the term has been referenced at least once.
     */
    referenced: boolean;
}

/**
 * Definitions map, keyed on href anchor.
 */
const definitionsMap = new Map<string, Definition>();

/**
 * Parse a string, ignoring formatting.
 *
 * @param inlines
 * Inline objects composing the string.
 *
 * @returns
 * String.
 */
function parseString(inlines: pandoc.Inline[]): string {
    let s = "";

    for (const inline of inlines) {
        switch (inline.t) {
            case "Str":
                // Simple string.
                s += inline.c;
                break;

            case "Space":
            case "SoftBreak":
            case "LineBreak":
                // Treat all whitespace as single space.
                s += " ";
                break;

            case "Emph":
            case "Strong":
            case "Strikeout":
            case "Superscript":
            case "Subscript":
            case "SmallCaps":
                // Ignore formatting and append contained string.
                s += parseString(inline.c);
                break;

            case "Span":
                // Ignore attributes and append contained string.
                s += parseString(inline.c[1]);
                break;

            default:
                break;
        }
    }

    return s;
}

/**
 * Build href anchor for a term.
 *
 * @param term
 * Term.
 *
 * @returns
 * Href anchor.
 */
function hrefFor(term: string): string {
    // Prefix with "def-" and replace all non-alphanumeric characters with hyphen.
    return `def-${term.replace(/[^A-Za-z0-9]/g, "-").toLowerCase()}`;
}

/**
 * Parse a definition list.
 *
 * @param definitionList
 * Definition list.
 *
 * @returns
 * Anchored definition list.
 */
function parseDefinitionList(definitionList: pandoc.EltMap["DefinitionList"]): pandoc.Elt<"DefinitionList"> {
    const anchoredDefinitionEntries = new Array<Parameters<typeof pandoc.DefinitionList>[0][0]>();

    for (const definitionEntry of definitionList) {
        const [termComponents, definitionBlocks] = definitionEntry;

        const term = parseString(termComponents);
        const href = hrefFor(term);

        let title: string | undefined = undefined;

        // Hover text is taken from the first normal paragraph found in any definition for the term.
        for (let definitionIndex = 0; title === undefined && definitionIndex < definitionBlocks.length; definitionIndex++) {
            const definitionBlock = definitionBlocks[definitionIndex];

            for (let contentBlockIndex = 0; title === undefined && contentBlockIndex < definitionBlock.length; contentBlockIndex++) {
                const contentBlock = definitionBlock[contentBlockIndex];

                switch (contentBlock.t) {
                    case "Plain":
                    case "Para":
                        title = parseString(contentBlock.c);
                        break;

                    default:
                        break;
                }
            }
        }

        // Replace term components with anchored term components.
        anchoredDefinitionEntries.push([[pandoc.Span([
            href,
            [],
            []
        ], termComponents)], definitionEntry[1]]);

        if (!definitionsMap.has(href)) {
            definitionsMap.set(href, {
                term,
                title,
                referenced: false
            });
        } else {
            console.error(`Duplicate definition for term "${term}"`);
        }
    }

    // Replace entire definition list.
    return pandoc.DefinitionList(anchoredDefinitionEntries);
}

/**
 * Trim leading and trailing space if any.
 *
 * @param inlines
 * Inline objects composing the string, modified inline.
 */
function trim(inlines: pandoc.Inline[]): void {
    if (inlines.length > 0 && inlines[0].t === "Space") {
        inlines.shift();
    }

    if (inlines.length > 0 && inlines[inlines.length - 1].t === "Space") {
        inlines.pop();
    }
}

/**
 * Parse a partial or complete paragraph for possible definitions.
 *
 * @param inlines
 * Inline objects composing partial or complete paragraph.
 *
 * @param nested
 * If true, caller is already parsing a definition reference.
 *
 * @returns
 * Inline objects composing the partial or complete paragraph with definition references linked to definitions.
 */
function parseDefinitionReferences(inlines: pandoc.Inline[], nested: boolean): pandoc.Inline[] {
    const parsedInlines = Array.from(inlines);

    let startIndex = -1;
    let preTermInline: pandoc.Elt<"Str"> | undefined = undefined;
    let termInlines: pandoc.Inline[] | undefined = undefined;
    let postTermInline: pandoc.Elt<"Str"> | undefined = undefined;

    let inlineIndex = 0;

    // This is not structured as a "for" loop because parsedInlines array is modified inside the loop, which violates the semantics of a "for" loop.
    while (inlineIndex < parsedInlines.length) {
        const inline = parsedInlines[inlineIndex];

        let addToTermInlines = true;

        switch (inline.t) {
            case "Str": {
                const s = inline.c;

                // Locate definition reference delimiter.
                let doubleColonIndex = s.indexOf("::");

                if (doubleColonIndex !== -1) {
                    // Closing definition reference delimiter can't be nested inside another tag.
                    if (!nested) {
                        // Processing around delimiters handles adding to termInlines if necessary.
                        addToTermInlines = false;

                        let commit = false;

                        if (termInlines === undefined) {
                            // This is an opening delimiter.
                            startIndex = inlineIndex;

                            // Preserve any text leading to delimiter.
                            if (doubleColonIndex !== 0) {
                                preTermInline = pandoc.Str(s.substring(0, doubleColonIndex));
                            }

                            termInlines = [];

                            // Check for possible single-word definition reference with no spaces.
                            const endDoubleColonIndex = s.indexOf("::", doubleColonIndex + 2);

                            if (endDoubleColonIndex === -1) {
                                if (doubleColonIndex !== s.length - 2) {
                                    // No space between double colon and start of definition reference.
                                    termInlines.push(pandoc.Str(s.substring(doubleColonIndex + 2)));
                                }
                            } else {
                                if (endDoubleColonIndex !== doubleColonIndex + 2) {
                                    // Definition reference is contained entirely in one string.
                                    termInlines.push(pandoc.Str(s.substring(doubleColonIndex + 2, endDoubleColonIndex)));
                                }

                                // Set to end double colon index for commit process.
                                doubleColonIndex = endDoubleColonIndex;

                                commit = true;
                            }
                        } else {
                            if (doubleColonIndex !== 0) {
                                // Preserve text up to delimiter.
                                termInlines.push(pandoc.Str(s.substring(0, doubleColonIndex)));
                            }

                            commit = true;
                        }

                        if (commit) {
                            // Preserve any text following delimiter.
                            if (doubleColonIndex !== s.length - 2) {
                                postTermInline = pandoc.Str(s.substring(doubleColonIndex + 2));
                            }

                            const replaceInlines = new Array<pandoc.Inline>();

                            if (preTermInline !== undefined) {
                                replaceInlines.push(preTermInline);
                            }

                            // Array is empty if text is quadruple colon.
                            if (termInlines.length !== 0) {
                                // Trim extraneous spaces before and after term.
                                trim(termInlines);

                                const term = parseString(termInlines);

                                // Swallow empty term.
                                if (term !== "") {
                                    const href = hrefFor(term);

                                    const definition = definitionsMap.get(href);

                                    if (definition !== undefined) {
                                        definition.referenced = true;
                                    } else {
                                        console.error(`Unresolved reference to term "${term}"`);
                                    }

                                    // Target is to anchor for term with definition title.
                                    const link = pandoc.Link([
                                        "",
                                        [],
                                        []
                                    ], termInlines, [
                                        `#${href}`,
                                        definition?.title ?? ""
                                    ]);

                                    replaceInlines.push(link);
                                } else {
                                    console.error("Empty definition reference found");
                                }
                            } else {
                                replaceInlines.push(pandoc.Str("::"));
                            }

                            const indexAdjustment = replaceInlines.length - 1;

                            if (postTermInline !== undefined) {
                                replaceInlines.push(postTermInline);
                            }

                            // Splice the link into the paragraph.
                            parsedInlines.splice(startIndex, inlineIndex + 1 - startIndex, ...replaceInlines);

                            inlineIndex = startIndex + indexAdjustment;

                            // Reset state.
                            startIndex = -1;
                            preTermInline = undefined;
                            termInlines = undefined;
                            postTermInline = undefined;
                        }
                    } else {
                        console.error("Cannot have closing definition reference inside another tag");
                    }
                }
            }
                break;

            case "Emph":
            case "Strong":
            case "Strikeout":
            case "Superscript":
            case "Subscript":
            case "SmallCaps":
                parsedInlines[inlineIndex] = pandoc.elt(inline.t, 1)(parseDefinitionReferences(inline.c, termInlines !== undefined));
                break;

            case "Span":
                parsedInlines[inlineIndex] = pandoc.Span(inline.c[0], parseDefinitionReferences(inline.c[1], termInlines !== undefined));
                break;

            default:
                break;
        }

        // Add to term inlines if required and currently processing a definition reference.
        if (addToTermInlines && termInlines !== undefined) {
            termInlines.push(inline);
        }

        inlineIndex++;
    }

    if (termInlines !== undefined) {
        console.error(`Unclosed definition reference: ${parseString(termInlines)}`);
    }

    // Replace entire partial or complete paragraph.
    return parsedInlines;
}

/**
 * Read source in its entirety.
 *
 * @param source
 * Source.
 *
 * @returns
 * Input as string promise.
 */
async function readSource(source: fs.ReadStream | (NodeJS.ReadStream & { fd: 0 })): Promise<string> {
    let result = "";

    source.setEncoding("utf8");

    for await (const chunk of source) {
        result += chunk;
    }

    return result;
}

/**
 * Execute the filter.
 *
 * @param source
 * Input source; defaults to stdin.
 */
export async function exec(source: fs.ReadStream | (NodeJS.ReadStream & { fd: 0 }) = process.stdin): Promise<void> {
    // Filter may generate format-specific output.
    const format = process.argv.length > 2 ? process.argv[2] : "";

    await readSource(source).then(async (jsonString) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Result type is known.
        const jsonData1 = JSON.parse(jsonString) as pandoc.PandocJson;

        // Parse definition lists on first pass.
        return await pandoc.filter(jsonData1, ele => ele.t === "DefinitionList" ? parseDefinitionList(ele.c) : ele, format);
    }).then(async jsonData2 =>
        // Parse definition references on second pass.
        await pandoc.filter(jsonData2, ele => ele.t === "Plain" || ele.t === "Para" ? pandoc.elt(ele.t, 1)(parseDefinitionReferences(ele.c, false)) : ele, format)
    ).then((outputData) => {
        // Write JSON to stdout.
        process.stdout.write(JSON.stringify(outputData));
    }).then(() => {
        // Log error for each unreferenced term.
        definitionsMap.values().filter(definition => !definition.referenced).forEach((definition) => {
            console.error(`Unreferenced term "${definition.term}"`);
        });
    }).catch((e: unknown) => {
        console.error(e);
    });
}
