# AMOS CODE ANALYSIS

This project analyses command usage in AMOS BASIC source-code datasets for
software-preservation, migration, and empirical language studies.

Run from this directory:

```sh
node main.js
node main.js --input ./datasets/example_dataset
node main.js --input="/path/to/another dataset"
```

The default input is the `datasets` directory beside `main.js`. Use `--input` to
select another directory; relative input paths resolve against your working
directory. The default input and command catalog work from any working directory.

The script recursively analyses regular `.asc` and `.txt` files, with
case-insensitive extensions and entries sorted by name. Other file types and
symbolic links are skipped. Each file starts with independent zero counts.

For each file, it prints `File: <path relative to the input directory>`, followed
by the existing instruction-count array and the array of commands with counts
above zero. This iteration does not produce aggregate statistics or export files.

If no matching files exist, it prints `No .asc or .txt files found.` and exits
successfully. Invalid arguments or filesystem failures produce an error on
stderr and a nonzero exit code.
