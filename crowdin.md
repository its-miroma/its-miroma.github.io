---
title: Crowdin
description: What I did to fix Crowdin.
authors:
  - its-miroma
---

<!-- markdownlint-disable search-replace titlecase-rule -->

If at any point what you see differs substantially from what I described, please inform me.

## Backup

Do a backup of the data.

## Create a PAT

Navigate to <https://crowdin.com/settings#api-key>, and create a token that will be used by the GitHub Actions workflow.

This page lists the scopes you must select: <https://github.com/crowdin/github-action#:~:text=Crowdin%20Personal%20Token%20scopes>

After you copied the generated token, set it as a secret of the Docs repository, with key `CROWDIN_TOKEN`, here: <https://github.com/FabricMC/fabric-docs/settings/secrets/actions>

## Install three apps on Crowdin

IMPORTANT: on the installation popup, you must choose "Selected projects" > "FabricMC". Don't install them on all "Projects you own", even if you only own one!

- Regex Content Processor: <https://store.crowdin.com/regex-content-processor>
  - used to disallow changes to `<<<` and `@[]()` links
- Segmentation Rules Generator: <https://store.crowdin.com/segmentation>
  - used to fix sentence duplication in Mandarin hopefully
- Force Reimport: <https://store.crowdin.com/reimport>
  - does what it says: reimports all files to apply the rule changes

## Configure the Markdown parser

Go to <https://crowdin.com/project/fabricmc/settings#parsers> (Settings > Parser configuration). Search for "Markdown" (not "Markdown (with front matter)"). Click on the three dots, then "Edit".

This is the configuration I set:

- ✅ Enable content segmentation
- ⬜ Use custom segmentation rules
- ✅ Exclude code blocks
- Excluded front matter elements:
  - `authors,authors-nogithub,layout,next.link,outline,prev.link`
- ...the rest all left as default (their first options)

Remember to click on "Save" at the bottom right.

## Configure the content processor

Go to <https://crowdin.com/project/fabricmc/settings#file-processors> (Settings > File Processors). There should be two entries named "Regex Content Processor", but I found that either links to the same page (I guess it's a bug).

Click on the three dots next to the first one, then "Edit". There are two sections: "Import Rules" and "Export Rules".

Add an Import Rule (there's a plus button on the bottom right).

- File Name: _leave it empty_
- Replace In: "File Content"
- Find: `^((?:<<<|@\[).*)$`
- Replace: `<!--$1-->`

Add an Export Rule:

- File Name: _leave it empty_
- Replace In: "File Content"
- Find: `^<!--((?:<<<|@\[).*)-->$`
- Replace: `$1`

Click on "Submit" at the bottom of the page.

These rules comment out lines starting with `<<<` or `@[`, to prevent translators from modifying them, then restore them on export.

## Configure custom segmentation

Go to <https://crowdin.com/project/fabricmc/tools> (Tools). You should see "Segmentation" and "Force Reimport" at the bottom. Click on "Segmentation".

Click on "create srx" on the top right. At the top left, where it says "New srx file", give it a descriptive name like "cjk-punctuation".

Expand the "Rules" details. Click on "Add rule". Here's my configuration:

- Split
- Before Break: `[。！？…]+[\p{Pe}]*`
- After Break: _leave it empty_
- Comment: `Break after CJK punctuation`
- Test string: `本页包含 loom Gradle 扩展中所有选项的参考。请参阅 Fabric API DSL 页面，了解与 Fabric API 特定功能相关的选项。`

"Segmentation Preview" should show (notice there are two pairs of scissors and an empty `[]` at the end):

```txt
[本页包含 loom Gradle 扩展中所有选项的参考。]✂[请参阅 Fabric API DSL 页面，了解与 Fabric API 特定功能相关的选项。]✂[]
```

Click on "Save" to save the rule. Click on "Save SRX" to save the file.

Switch to the "APPLY SRX TO FILES" tab. Select the "fabric-docs" directory. Click on "Apply now".

## Reimport all files

Go to <https://crowdin.com/project/fabricmc/tools> (Tools). Click on "Force Reimport". Select the "fabric-docs" directory. Click on "Force reimport". This will take some time, you should not close the tab.

## Other configuration

You probably have these set already.

- Settings > QA Checks: Disable the following:
  - Android syntax
  - Numbers mismatch
- Settings > Export: Skip untranslated files
