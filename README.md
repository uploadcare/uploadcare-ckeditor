# Uploadcare CKEDITOR Plugin

This is a plugin for [CKEDITOR][3] to work with [Uploadcare][1].

## Demo

Minimalistic demo can be found [here][7].

## Requirements

- CKEDITOR 4.0+

## Install

Clone plugin from git to your plugins directory:

    git clone git://github.com/uploadcare/uploadcare-ckeditor.git plugins/uploadcare

Initialize a CKEDITOR plugin with additional params:

    <script>
      UPLOADCARE_PUBLIC_KEY = "demopublickey"; //set publick key for Uploadcare
      UPLOADCARE_LOCALE = 'ru'; //set locale if you wish
      CKEDITOR.replace( 'editor1', {
        extraPlugins: 'uploadcare', // this will enable plugin
        toolbar: [
          [ 'Bold', 'Italic', '-', 'NumberedList', 'BulletedList', '-', 'Link', 'Unlink', '-', 'Uploadcare' ]
        ]
      });

    </script>

You can heavily customize widget behavior, i.e. file sources, file validation and much more, please
read Uploadcare [widget][5] and [javascript API][6] documentation.

## File Autostore

"Automatic file storing" **should** be enabled in your project settings.
Please follow https://uploadcare.com/dashboard/ to ensure.

If you do not want to enable "Autostore", you can try to use *deprecated* [php-based version][4]

## Usage

1. Press "Uploadcare" button.
2. Select a file to upload and press "Upload"
3. Wait for file to be uploaded.
4. Crop an image as you wish.
5. Click "Done". A cropped image will be available inside editor.

[1]: https://uploadcare.com/
[2]: https://uploadcare.com/documentation/cdn/
[3]: http://ckeditor.com
[4]: https://github.com/uploadcare/uploadcare-ckeditor/tree/php-dialog
[5]: https://uploadcare.com/documentation/widget/
[6]: https://uploadcare.com/documentation/javascript_api/
[7]: https://uploadcare.com/demos/ckeditor/
