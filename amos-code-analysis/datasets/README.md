# Datasets

This directory stores input datasets for amos-code-analysis. Each child directory is one
dataset, and each immediate child of a dataset is one AMOS project:

```text
datasets/
└── dataset_name/
    ├── project_one/
    │   ├── program.asc
    │   └── source/helper.txt
    └── project_two/
        └── game.asc
```

Select one dataset as the input root. Each immediate child directory is a project;
AMOS `.asc` and `.txt` files may be at the project root or at any depth below it.
Extensions are case-insensitive; other file types and symbolic links are skipped.
Files directly inside the dataset root are ignored.

`datasets/example_dataset` is the default input. From `amos-code-analysis`,
run `node main.js` to analyse its projects recursively. Select another dataset with
`node main.js --input ./datasets/example_dataset` or
`node main.js --input="/path/to/another dataset"`. Relative input paths resolve
against the working directory. Select a dataset, rather than the `datasets`
container or an individual project.

Each run saves a per-file CSV to `amos-code-analysis/output/analysis.csv`. Its columns
are `COMMAND,CATEGORY,COUNT,PROJECT,FILE_PATH`: the project directory's name and
the file path relative to that project identify each used instruction's counts.
File paths use `/` separators.

`amos-code-analysis/output/aggregate.csv` summarizes the same selected dataset
with `COMMAND,CATEGORY,TOTAL_COUNT,PROJECT_COUNT,FILE_COUNT`. Totals sum command
occurrences; project and file counts measure distinct containers containing the
command. Both reports contain used commands only and are replaced on each
successful run.

`example_dataset` is tracked, so a fresh clone can run amos-code-analysis
immediately. `reanimate_examples` is local input data and is intentionally ignored
by Git.
