# File Uploader by Uploadcare

<a href="https://uploadcare.com/?utm_source=github&utm_campaign=uploadcare-ckeditor">
    <img align="right" width="64" height="64"
         src="https://ucarecdn.com/2f4864b7-ed0e-4411-965b-8148623aa680/uploadcare-logo-mark.svg"
         alt="">
</a>

This is a plugin for [CKEditor v4][3] to work with [Uploadcare Widget](https://uploadcare.com/features/widget/?utm_source=github&utm_campaign=uploadcare-ckeditor).

[![GitHub release][badge-release-img]][badge-release-url]&nbsp;
[![Uploadcare stack on StackShare][badge-stack-img]][badge-stack-url]

## Demo

Minimalistic demo can be found [here][7].

## Requirements

CKEditor 4.0+ (not 5).

Plugin for CKEditor v5 will be ready soon. Stay tuned.

## Install

You’re free to choose from the install methods listed below.

### Automatic install

Simply add [plugin](http://ckeditor.com/addon/uploadcare) to [CKBuilder][ck-docs-online-builder].

You can find more inforamtion at [CKBuilder Documentation][ck-docs-auto-install].

### Manual install

Download latest plugin archive from [release branch][release-branch] 
or from [releases page][releases-page].

Extract the downloaded plugin into the plugins folder of your CKEditor installation.

Also you can clone repository:

```
git clone -b release git@github.com:uploadcare/uploadcare-ckeditor.git plugins/uploadcare
```

Or just load it in your page:

```javascript
CKEDITOR.plugins.addExternal('uploadcare', '/absolute/path/to/uploadcare/plugin.js')
```

You can find more information about how to manually install plugins on [CKEditor Documentation][ck-docs-manual-install].

## Usage

Add `uploadcare` to the list of CKEditor plugins and toolbar.
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

You can heavily customize widget behavior, i.e. file sources, file validation and much more, please
read [Uploadcare Widget][widget-docs-config] and [javascript API][widget-docs-js-api] documentation.

## File Autostore

"Automatic file storing" **should** be enabled in your project settings.
Please follow https://uploadcare.com/dashboard/ to ensure.

## Usage

1. Press "Uploadcare" button.
2. Select a file to upload and press "Upload"
3. Wait for file to be uploaded.
4. Crop an image as you wish.
5. Click "Done". A cropped image will be available inside editor.

## Feedback

Send any feedback or request support at hello@uploadcare.com

[widget-docs-config]: https://uploadcare.com/docs/uploads/widget/config/
[widget-docs-js-api]: https://uploadcare.com/docs/api_reference/javascript/
[widget-docs-options-public-key]: https://uploadcare.com/docs/uploads/widget/config/#option-public-key
[1]: https://uploadcare.com/
[3]: https://ckeditor.com/ckeditor-4/
[5]: https://uploadcare.com/docs/uploads/widget/
[6]: https://uploadcare.com/docs/api_reference/javascript/
[7]: https://uploadcare.github.io/uploadcare-ckeditor/
[releases-page]: https://github.com/uploadcare/uploadcare-ckeditor/releases
[ck-docs-auto-install]: https://docs.ckeditor.com/ckeditor4/latest/guide/dev_plugins.html#online-builder-installation
[ck-docs-manual-install]: https://docs.ckeditor.com/ckeditor4/latest/guide/dev_plugins.html#manual-installation
[ck-docs-online-builder]: https://ckeditor.com/cke4/builder
[release-branch]: https://github.com/uploadcare/uploadcare-ckeditor/tree/release
[badge-stack-img]: http://img.shields.io/badge/tech-stack-0690fa.svg?style=flat
[badge-stack-url]: https://stackshare.io/uploadcare/stacks/
[badge-release-img]: https://img.shields.io/github/release/uploadcare/uploadcare-ckeditor.svg
[badge-release-url]: https://github.com/uploadcare/uploadcare-ckeditor/releases
