#!/bin/sh -x

set -e

export LANG=C
export LC_ALL=C
# Run 'npm install @mdi/svg' beforehead
MDISVG_PATH='node_modules/@mdi/svg/svg/'

#Put inkscape and convert into PATH
PATH=$PATH:/Applications/Inkscape.app/Contents/MacOS/

mkdir -p images
convert -size 32x32 xc:none images/background16@2x.png
convert -size 16x16 xc:none images/background16.png

SIZES="
16,16
32,16@2x
"
FILES=`ls ${MDISVG_PATH} |grep svg`
for SVG in $FILES; do
    BASE=$(basename "$SVG" | sed 's/\.[^\.]*$//')
    for PARAMS in $SIZES; do
        SIZE=$(echo $PARAMS | cut -d, -f1)
        LABEL=$(echo $PARAMS | cut -d, -f2)
        inkscape -w $SIZE -h $SIZE "$MDISVG_PATH/$SVG" \
            -o "images/mdi-${BASE}${LABEL}".png
        echo "Written images/mdi-${BASE}${LABEL}".png
        convert -verbose \
            -composite images/background${LABEL}.png "images/mdi-${BASE}${LABEL}".png \
            -compose CopyAlpha \
            "images/mdi-${BASE}Template${LABEL}".png
    done
done
