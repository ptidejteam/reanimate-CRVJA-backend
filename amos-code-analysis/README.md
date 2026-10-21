# AMOS CODE ANALYSIS

This project analyses AMOS BASIC programs to help decide which commands to
implement next in **CRVJA**, a web-based AMOS-to-JavaScript transpiler and
environment for running retro Amiga games and applications in the browser. See
the [CRVJA frontend README](../../reanimate-CRVJA-frontend/README.md) for the broader
project context.

## Why command usage matters

AMOS Professional has more than 700 commands, so CRVJA needs an implementation
priority rather than attempting to support the entire language at once. Our
first prioritization uses the `CATEGORY` field from the
[AMOS Professional Manual](https://amospromanual.dev), which distinguishes
structures, functions, instructions, and other command types. These categories
provide an initial way to organize the work, but still leave many commands to
implement.

This analysis adds evidence from actual programs to refine those priorities.
The approach is to collect AMOS programs from websites and code repositories,
organize their source code into datasets, and measure which commands occur most
often and across how many projects. Supporting widely used commands first should
help CRVJA run more of those programs sooner.

The workflow is:

1. Collect AMOS source programs into a dataset, with one directory per project.
2. Analyse their source files against the command catalog.
3. Use the per-file and aggregate CSV reports to compare command frequency and
   usage across projects, alongside the category-based priorities.

The current analyser counts only catalog entries whose `CATEGORY` is
`Instruction`, using tokens recognized by the backend's AMOS grammar. The broader
goal is to inform command implementation priorities, but the current reports do
not measure every category or every AMOS command. Results describe the selected
dataset, so their usefulness depends on the range of programs collected. The
reports provide evidence for prioritization; they do not automatically produce a
ranked implementation roadmap.

## Running the analysis

Run from this directory:

```sh
node main.js
node main.js --input ./datasets/example_dataset
node main.js --input="/path/to/another dataset"
```

The input is one dataset directory. Its immediate child directories are projects,
with AMOS files at the project root or in any subdirectory. Files directly inside
the dataset root are ignored.

The default input is `datasets/example_dataset` beside `main.js`. Use `--input`
to select another dataset; relative input paths resolve against your working
directory. The default input, command catalog, and output location work from any
working directory.

The script recursively analyses regular `.asc` and `.txt` files, with
case-insensitive extensions. Projects and directory entries are sorted by name;
command rows retain catalog order. Other file types and symbolic links are
skipped. Each file starts with independent zero counts.

Each successful run creates or replaces `output/analysis.csv` and
`output/aggregate.csv`, then prints `Saved CSV: <absolute path>` for each report.
The per-file report contains one row per used instruction per file, with its
frequency in `COUNT`:

```csv
COMMAND,CATEGORY,COUNT,PROJECT,FILE_PATH
CURS OFF,Instruction,1,1_cool_amos_project,graphics/colours.asc
```

`PROJECT` is the immediate child directory's name. `FILE_PATH` is relative to that
project and uses `/` separators. CSV fields containing commas, quotes, or newlines
are escaped. Output is UTF-8 and generated reports are ignored by Git.

The aggregate report groups used commands by `COMMAND` and `CATEGORY`, sorted by
command then category:

```csv
COMMAND,CATEGORY,TOTAL_COUNT,PROJECT_COUNT,FILE_COUNT
CURS OFF,Instruction,1,1,1
```

`TOTAL_COUNT` sums occurrences across the selected dataset. `PROJECT_COUNT` and
`FILE_COUNT` count distinct projects and files containing the command. A file is
identified by its project and project-relative path, so identical paths in
different projects are counted separately. Both reports cover only the current
dataset, not other datasets or previous runs. Files are analysed once; aggregation
uses the same in-memory rows as the per-file report.

An empty dataset or files without counted commands produce two header-only CSVs.
Invalid arguments or filesystem failures produce an error on stderr and a nonzero
exit code. Analysis finishes before writing, so an analysis failure leaves the
previous reports intact.

## Tests

The tests are in `tests/`. From the backend root, run them with
`npm test -- amos-code-analysis` (or `npm test` for the whole backend).
