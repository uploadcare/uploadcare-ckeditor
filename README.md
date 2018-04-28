# Uploadcare CKEditor Plugin

This is a plugin for [CKEditor v4][3] to work with [Uploadcare][1].

[![Uploadcare stack on StackShare][stack-img]][stack]

## Demo

Minimalistic demo can be found [here][7].

## Requirements

CKEditor 4.0+ (not 5)

Plugin for CKEditor v5 will be ready soon. Stay tuned.

## Install

### Automatic install
Simply add [Uploadcare plugin](http://ckeditor.com/addon/uploadcare) to [CKBuilder][ck-docs-online-builder].

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

## Configure

Initialize a CKEditor plugin with additional params:

```javascript
UPLOADCARE_PUBLIC_KEY = "demopublickey"; // set public key for Uploadcare
UPLOADCARE_LOCALE = 'ru'; // set locale if you wish
CKEDITOR.replace( 'editor1', {
  extraPlugins: 'uploadcare', // this will enable plugin
  toolbar: [
    // add Uploadcare button to toolbar, e.g.:
    ['Bold', 'Italic', '-', 'NumberedList', 'BulletedList', '-', 'Link', 'Unlink', '-', 'Uploadcare']
  ]
});
```

You can heavily customize widget behavior, i.e. file sources, file validation and much more, please
read Uploadcare [widget][5] and [javascript API][6] documentation.

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
[stack-img]: http://img.shields.io/badge/tech-stack-0690fa.svg?style=flat
[stack]: https://stackshare.io/uploadcare/stacks/
