#!/usr/bin/env bash

clear

bun build                                       \
    --watch                                     \
    --outfile Website/Scripts/Awa.js            \
    --tsconfig-override Source/tsconfig.json    \
    Source/mod.ts
