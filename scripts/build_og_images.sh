#!/usr/bin/env bash
set -euo pipefail

project_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
background="$project_dir/public/og-background.png"
output_dir="$project_dir/public"
title_color="#302548"
body_color="#6f677b"
latin_bold=$(fc-match -f '%{file}' 'Noto Sans:style=Bold')
latin_regular=$(fc-match -f '%{file}' 'Noto Sans:style=Regular')
cjk_bold=$(fc-match -f '%{file}' 'Noto Sans CJK JP:style=Bold')
cjk_light=$(fc-match -f '%{file}' 'Noto Sans CJK JP:style=Light')

base_args=(
  "$background"
  -resize '1200x630^'
  -gravity center
  -extent 1200x630
  -gravity northwest
)

magick "${base_args[@]}" \
  -font "$latin_bold" -fill "$title_color" -pointsize 66 \
  -annotate +78+194 'Gender Experience' \
  -annotate +78+284 'Index' \
  -font "$latin_regular" -fill "$body_color" -pointsize 26 \
  -annotate +81+350 'Gender experiences are categorized for' \
  -annotate +81+390 'personal reflection and research.' \
  -strip -define png:compression-level=9 "$output_dir/og-image-en.png"

magick "${base_args[@]}" \
  -font "$cjk_bold" -fill "$title_color" -pointsize 62 \
  -annotate +78+200 'ジェンダー経験事典' \
  -font "$cjk_light" -fill "$body_color" -pointsize 28 \
  -annotate +81+326 'ジェンダー経験を分類・整理し、' \
  -annotate +81+368 '自己理解や調査・研究に' \
  -annotate +81+410 '活用できる資料です。' \
  -strip -define png:compression-level=9 "$output_dir/og-image-ja.png"

magick "${base_args[@]}" \
  -font "$cjk_bold" -fill "$title_color" -pointsize 66 \
  -annotate +78+202 '性别体验索引' \
  -font "$cjk_light" -fill "$body_color" -pointsize 30 \
  -annotate +81+326 '本资料分类整理常见性别体验，' \
  -annotate +81+372 '可用于自我理解与相关研究。' \
  -strip -define png:compression-level=9 "$output_dir/og-image-zh-cn.png"

cp "$output_dir/og-image-en.png" "$output_dir/og-image.png"
