# Definition Reference Examples

## Pre-Prose Definitions

Definitions may appear anywhere in the document. These definitions appear before they are referenced.

Specification

:   A specification often refers to a set of documented requirements to be satisfied by a material, design, product, or service. A specification is often a type of technical standard.

    Source: [Wikipedia](https://en.wikipedia.org/wiki/Specification_(technical_standard))

Specifications

:   ::Specification::

Compound word

:   Two or more ::words:: combined to form a new single ::word:: or a phrase that acts like a single word.

    There are three different types of compound words in grammar: open compound words with spaces between the words (*ice cream*), closed compound words with no spaces (*firefighter*), and hyphenated compound words (*up-to-date*).

    Source: [Grammarly](https://www.grammarly.com/blog/grammar/open-and-closed-compound-words/)

Compound words

:   ::Compound word::

Word

:   The bird is the word.

    Source: [The Trashmen](https://www.youtube.com/watch?v=9Gc4QTqslN4)

Words

:   ::Word::

## The Prose

When writing ::specifications::, it is often necessary to define terms to remove ::ambiguity::. This is especially true when a ::specification:: is defining new terms, adding new meaning to existing terms, or creating ::compound words:: which are novel in nature and highly specific to the document.

It's also common for a ::specification:: to define an ::Abbreviation Just Because:: (AJB), similar to a ::compound word::, which can be confusing to new readers.

Readers, especially those new to the subject, are often forced to jump around the document, to remind themselves of a term's meaning. To make things easier, this [Pandoc](https://pandoc.org/) filter uses [definition lists](https://pandoc.org/MANUAL.html#definition-lists) as sources for terms and a special syntax to link to those terms within the document body.

The filter takes the first normal paragraph in the definition and uses it as ::hover text:: or, more formally, a ::CSS tooltip::. Clicking on the term takes the reader to the full definition. To reference a term, surround it with double-colons (e.g., ::::hover text::::), and to use double-colons directly, use four of them (e.g., ::::::::).

## Post-Prose Definitions

Definitions may appear anywhere in the document. These definitions appear after they are referenced.

Ambiguity

:   A word or expression that can be understood in two or more possible ways; an ambiguous word or expression.

    The quality or state of being ambiguous especially in meaning.

    Source: [Merriam Webster](https://www.merriam-webster.com/dictionary/ambiguity)

Abbreviation Just Because

:   An Abbreviation Just Because (AJB) is an arbitrary abbreviation consisting of the first letters of the term, used to demonstrate aliasing.

AJB

:   ::Abbreviation Just Because::

Hover text

:   Text that is displayed when the mouse or some other pointer is held over a displayed object.

CSS tooltip

:   An implementation of ::hover text:: specifically within a browser, using Cascading Style Sheet syntax to define how the text appears. See an example [here](https://www.w3schools.com/css/css_tooltip.asp).

Extraneous definition

:   This really shouldn't be here.
