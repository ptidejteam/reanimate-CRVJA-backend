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

AMOS `.asc` and `.txt` files may be at the input root or at any depth below it.
Extensions are case-insensitive; other file types and symbolic links are skipped.
The directory layout above is a convention, not a requirement for loading files.

The entire `datasets` directory is the default input. From `amos-code-analysis`,
run `node main.js` to analyse it recursively. Select another directory with
`node main.js --input ./datasets/example_dataset` or
`node main.js --input="/path/to/another dataset"`. Relative input paths resolve
against the working directory. Printed file paths are relative to the selected
input directory.

`example_dataset` is tracked, so a fresh clone can run amos-code-analysis
immediately. `reanimate_examples` is local input data and is intentionally ignored
by Git.
