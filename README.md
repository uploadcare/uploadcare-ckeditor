# Uploadcare CKEditor Plugin

This repo holds the [Uploadcare][1] plugin for [CKEditor][3].

## Requirements

CKEditor 4.0+

## Installation

Add the [plugin](http://ckeditor.com/addon/uploadcare) to CKBuilder
[Download](https://github.com/uploadcare/uploadcare-ckeditor/blob/master/plugin.js)
the plugin directly or clone the repo itself to your plugins directory:

    git clone git://github.com/uploadcare/uploadcare-ckeditor.git plugins/uploadcare

## Usage

This section describes a basic usage scenario for
the Uploadcare plugin within CKEditor.

1. Discover and click the "Uploadcare" button.
2. Select a file to upload and press "Upload".
3. Wait for the file to get uploaded.
4. (Image files only) preview an image and crop it if necessary.
5. Click "Done". Your file will become available in the editor.

## Configure

Here's an example of how to initialize the CKEditor
plugin with additional params:

```javascript
UPLOADCARE_PUBLIC_KEY = "demopublickey"; // set your Uploadcare public key
UPLOADCARE_LOCALE = 'ru'; // define a locale of your preference
CKEDITOR.replace( 'editor1', {
  extraPlugins: 'uploadcare', // this enables the plugin
  toolbar: [
    // add Uploadcare button to the toolbar, e.g.:
    ['Bold', 'Italic', '-', 'NumberedList', 'BulletedList', '-', 'Link', 'Unlink', '-', 'Uploadcare']
  ]
});
```

Please note that you can deeply customize the Uploadcare Widget behavior.
This includes defining file sources, file validation and much more.
If that's what you want, please look through the [Uploadcare Widget][5]
and [javascript API][6] documentation.

## Demo

A laconic demo can be found [here][7].

## File Autostore

In order for the plugin to work fine,
"Automatic file storing" **should** be enabled in your project settings.
You can check your project settings from
[here](https://uploadcare.com/dashboard/).

## Contributors

* [@grayhound](https://github.com/grayhound)
* [@dmitry-mukhin](https://github.com/dmitry-mukhin)
* [@homm](https://github.com/homm)
* [@disolovyov](https://github.com/disolovyov)

Current maintainers are: [@Zmoki](https://github.com/Zmoki),
[@dmitry-mukhin](https://github.com/dmitry-mukhin).

## Feedback

Feel free to share your feedback
or request support at hello@uploadcare.com.

[1]: https://uploadcare.com/
[2]: https://uploadcare.com/documentation/cdn/
[3]: http://ckeditor.com
[5]: https://uploadcare.com/documentation/widget/
[6]: https://uploadcare.com/documentation/javascript_api/
[7]: https://uploadcare.com/demos/ckeditor/
