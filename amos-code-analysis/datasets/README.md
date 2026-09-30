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

AMOS `.asc` and `.txt` files may be at the project root or at any depth below it.
Paths in the report are relative to the project. Select one dataset—not the
`datasets` container itself—with `--input`.

`example_dataset` is tracked and is the default, so a fresh clone can run amos-code-analysis
immediately. `reanimate_examples` is local input data and is intentionally ignored
by Git.
