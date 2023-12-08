#! /usr/bin/bash

# Copying views (pages) dir to ./dist dir
cp -r ./src/views ./dist

# Copying assets (pictures) dir to ./dist public dir
cp -r ./src/public/assets ./dist/public

# Copying stylesheets (css) dir to ./dist public dir
cp -r ./src/public/stylesheets ./dist/public