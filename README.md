# File Uploader by Uploadcare

<a href="https://uploadcare.com/?utm_source=github&utm_campaign=uploadcare-ckeditor">
    <img align="right" width="64" height="64"
         src="https://ucarecdn.com/2f4864b7-ed0e-4411-965b-8148623aa680/uploadcare-logo-mark.svg"
         alt="">
</a>

This is a [plugin][ck-uc-plugin] for [CKEditor v4][ck-4] providing it to work
with [Uploadcare Widget][uc-feature-widget].

[![GitHub release][badge-release-img]][badge-release-url]&nbsp;
[![Uploadcare stack on StackShare][badge-stack-img]][badge-stack-url]

* [Demo](#demo)
* [Requirements](#requirements)
* [Install](#install)
  * [Automatic](#automatic-install)
  * [Manual](#manual-install)
* [Usage](#usage)
* [Configuration](#configuration)
  * [Plugin config](#plugin-configuration)
  * [Widget config](#widget-configuration)
* [Security issues](#security-issues)
* [Feedback](#feedback)

## Demo

Check out the basic demo [here][demo].

## Requirements

CKEditor 4.0+ (not 5).

File Uploader for CKEditor v5 is on its way. Stay tuned.

## Install

You can go with either [automatic](#automatic-install) or
[manual](#manual-install) install.

### Automatic install

Just add the [File Uploader][ck-uc-plugin] plugin to your
[CKBuilder][ck-docs-online-builder].

You can find more info in the [CKBuilder docs][ck-docs-auto-install].

### Manual install

Download the latest plugin archive from the
[release branch][github-branch-release] or [releases page][github-releases].

Extract the downloaded archive to the plugin directory of your CKEditor
installation.

Other options here are either cloning the repo:

```bash
git clone -b release git@github.com:uploadcare/uploadcare-ckeditor.git plugins/uploadcare
```

Or directly loading it in your page:

```javascript
CKEDITOR.plugins.addExternal('uploadcare', '/absolute/path/to/uploadcare/plugin.js')
```

You can find more info on manually installing plugins in the
[CKEditor docs][ck-docs-manual-install].

## Usage

Add `uploadcare` to the list of your CKEditor plugins and the toolbar.
**Set your [public key][uc-widget-docs-option-public-key]**. Public keys are
used to identify a target Uploadcare [project][uc-projects] your uploads will
go to.

```
CKEDITOR.replace('editor', {
  extraPlugins: 'uploadcare',
  toolbar: [['Uploadcare', /* Your toolbar items */]],
  uploadcare: {publicKey: 'YOUR_PUBLIC_KEY'},
})
```

## Configuration

### Plugin configuration

To apply a custom configuration, initialize the plugin providing additional
options:

```javascript
UPLOADCARE_LOCALE = 'ru' // set a preferred locale if needed

CKEDITOR.replace('editor', {
  extraPlugins: 'uploadcare',
  toolbar: [['Uploadcare', /* your toolbar items */]],
  uploadcare: {
    publicKey: 'YOUR_PUBLIC_KEY', // set your public API key here
    multiple: true, // allow multi-file uploads
    crop: '1:1,4:3', // set crop options when handling images
    /* feel free to add more “object key” options here */
  },
})
```

### Widget configuration

Uploadcare Widget can be deeply customized to suit your UX/UI. You can define
allowed upload sources, implement file validation, and more.

Use our live [widget sandbox][uc-widget-configure] as a starting point and consider
checking out the docs on [widget configuration][uc-widget-docs-config] and its
[JavaScript API][uc-widget-docs-js-api].

## Security issues

If you think you ran into something in Uploadcare libraries which might have
security implications, please hit us up at [bugbounty@uploadcare.com][uc-email-bounty]
or Hackerone.

We'll contact you personally in a short time to fix an issue through co-op and
prior to any public disclosure.

## Feedback

Issues and PRs are welcome. You can provide your feedback or drop us a support
request at [hello@uploadcare.com][uc-email-hello].

[ck-uc-plugin]: https://ckeditor.com/addon/uploadcare
[ck-4]: https://ckeditor.com/ckeditor-4/
[uc-feature-widget]: https://uploadcare.com/features/widget/?utm_source=github&utm_campaign=uploadcare-ckeditor
[badge-release-img]: https://img.shields.io/github/release/uploadcare/uploadcare-ckeditor.svg
[badge-release-url]: https://github.com/uploadcare/uploadcare-ckeditor/releases
[badge-stack-img]: https://img.shields.io/badge/tech-stack-0690fa.svg?style=flat
[badge-stack-url]: https://stackshare.io/uploadcare/stacks/
[demo]: https://uploadcare.github.io/uploadcare-ckeditor/
[ck-docs-online-builder]: https://ckeditor.com/cke4/builder
[ck-docs-auto-install]: https://docs.ckeditor.com/ckeditor4/latest/guide/dev_plugins.html#online-builder-installation
[github-releases]: https://github.com/uploadcare/uploadcare-ckeditor/releases
[github-branch-release]: https://github.com/uploadcare/uploadcare-ckeditor/tree/release
[ck-docs-manual-install]: https://docs.ckeditor.com/ckeditor4/latest/guide/dev_plugins.html#manual-installation
[uc-widget-docs-option-public-key]: https://uploadcare.com/docs/uploads/widget/config/?utm_source=github&utm_campaign=uploadcare-ckeditor#option-public-key
[uc-projects]: https://uploadcare.com/docs/keys/?utm_source=github&utm_campaign=uploadcare-ckeditor#projects
[uc-widget-configure]: https://uploadcare.com/widget/configure/3.x/?utm_source=github&utm_campaign=uploadcare-ckeditor
[uc-widget-docs-config]: https://uploadcare.com/docs/uploads/widget/config/?utm_source=github&utm_campaign=uploadcare-ckeditor
[uc-widget-docs-js-api]: https://uploadcare.com/docs/api_reference/javascript/?utm_source=github&utm_campaign=uploadcare-ckeditor
[github-contributors]: https://github.com/uploadcare/uploadcare-ckeditor/graphs/contributors
[uc-email-bounty]: mailto:bugbounty@uploadcare.com
[uc-email-hello]: mailto:hello@uploadcare.com
