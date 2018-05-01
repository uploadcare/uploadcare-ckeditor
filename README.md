# File Uploader by Uploadcare

<a href="https://uploadcare.com/?utm_source=github&utm_campaign=uploadcare-ckeditor">
    <img align="right" width="64" height="64"
         src="https://ucarecdn.com/2f4864b7-ed0e-4411-965b-8148623aa680/uploadcare-logo-mark.svg"
         alt="">
</a>

This is a plugin for [CKEditor v4][ck-4] to work with [Uploadcare Widget][uc-feature-widget].

[![GitHub release][badge-release-img]][badge-release-url]&nbsp;
[![Uploadcare stack on StackShare][badge-stack-img]][badge-stack-url]

## Demo

A minimalistic demo can be found [here][demo].

## Requirements

CKEditor 4.0+ (not 5).

A File Uploader for CKEditor v5 will be ready soon. Stay tuned.

## Install

You’re free to choose from the install methods listed below.

### Automatic install

Simply add the [File Uploader plugin][ck-uc-plugin] to [CKBuilder][ck-docs-online-builder].

You can find more information in the [CKBuilder docs][ck-docs-auto-install].

### Manual install

Download the latest plugin archive from the [release branch][release-branch]
or [releases page][releases-page].

Extract the downloaded plugin into the plugins folder of your CKEditor installation.

Also you can clone repository:

```
git clone -b release git@github.com:uploadcare/uploadcare-ckeditor.git plugins/uploadcare
```

Or just load it in your page:

```javascript
CKEDITOR.plugins.addExternal('uploadcare', '/absolute/path/to/uploadcare/plugin.js')
```

You can find more info on manually installing plugins in the [CKEditor docs][ck-docs-manual-install].

## Usage

Add `uploadcare` to your list of CKEditor plugins and toolbar.
**Set your [public key][widget-docs-options-public-key]**. 

```
CKEDITOR.replace('editor', {
  extraPlugins: 'uploadcare',
  toolbar: [['Uploadcare', /* Your toolbar items */]],
  uploadcare: {publicKey: 'YOUR_PUBLIC_KEY'},
})
```

## Configuration

Initialize a plugin with additional options:

```javascript
UPLOADCARE_LOCALE = 'ru' // set locale if you wish

CKEDITOR.replace('editor', {
  extraPlugins: 'uploadcare',
  toolbar: [['Uploadcare', /* Your toolbar items */]],
  uploadcare: {
    publicKey: 'YOUR_PUBLIC_KEY',
    multiple: true,
    crop: '1:1,4:3',
  },
})
```

You can deeply customize the widget behavior: file sources, file validation, and much more.
Please, check out the [Uploadcare Widget][widget-docs-config] and [JavaScript API][widget-docs-js-api] docs.

## Feedback

Your feedback or support requests are welcome at [hello@uploadcare.com][uc-email-hello].

[uc-email-hello]: mailto:hello@uploadcare.com
[demo]: http://uploadcare.github.io/uploadcare-ckeditor/
[uc-feature-widget]: https://uploadcare.com/features/widget/?utm_source=github&utm_campaign=uploadcare-ckeditor
[widget-docs-config]: https://uploadcare.com/docs/uploads/widget/config/
[widget-docs-js-api]: https://uploadcare.com/docs/api_reference/javascript/
[widget-docs-options-public-key]: https://uploadcare.com/docs/uploads/widget/config/#option-public-key
[releases-page]: https://github.com/uploadcare/uploadcare-ckeditor/releases
[release-branch]: https://github.com/uploadcare/uploadcare-ckeditor/tree/release
[ck-4]: https://ckeditor.com/ckeditor-4/
[ck-uc-plugin]: http://ckeditor.com/addon/uploadcare
[ck-docs-auto-install]: https://docs.ckeditor.com/ckeditor4/latest/guide/dev_plugins.html#online-builder-installation
[ck-docs-manual-install]: https://docs.ckeditor.com/ckeditor4/latest/guide/dev_plugins.html#manual-installation
[ck-docs-online-builder]: https://ckeditor.com/cke4/builder
[badge-stack-img]: http://img.shields.io/badge/tech-stack-0690fa.svg?style=flat
[badge-stack-url]: https://stackshare.io/uploadcare/stacks/
[badge-release-img]: https://img.shields.io/github/release/uploadcare/uploadcare-ckeditor.svg
[badge-release-url]: https://github.com/uploadcare/uploadcare-ckeditor/releases
