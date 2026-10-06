# AMOS CODE ANALYSIS

This project analyses command usage in AMOS BASIC source-code datasets for
software-preservation, migration, and empirical language studies.

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
