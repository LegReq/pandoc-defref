# Pandoc Definition Reference Extension

This is a [Pandoc](https://pandoc.org/) filter that uses [definition lists](https://pandoc.org/MANUAL.html#definition-lists) as sources for terms and a special syntax to link to those terms within the document body.

Put simply, if you have a term defined in your Markdown using the definition list syntax as follows:

```text
term

:   The definition of the term goes here.

    Multiple paragraphs may be present, if the term requires an extended definition.
```

then you can reference the term in other parts of the document like this:

```text
Here, we make use of the ::term:: to show how the first paragraph is displayed as hover text and how the 
```

For a detailed example, see the following in the `example` directory:

* example.md - A source file with multiple definitions and references to those definitions.
* example.json - Intermediate Pandoc [AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree) output for debugging purposes.
* example.html - Rendered HTML.
* pandoc-pre-defref.yaml - Pandoc response file for generating example.json.
* pandoc.yaml - Pandoc response file for generating example.html.
