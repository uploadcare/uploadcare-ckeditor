# Uploadcare CKEDITOR Plugin

This is a plugin for [CKEDITOR][4] to work with [Uploadcare][1].

It's based on a [uploadcare-php][3] library.

## Requirements

- CKEDITOR 4.0+

## Optional for PHP version.

- [iframedialog][5] plugin for CKEDITOR
- PHP 5.2+
- php-curl

**Note!** PHP implementation is optional by now and we higly recommend not to use it.

## Install

Install iframedialog plugin.

Clone plugin from git to your plugins directory:

    git clone git://github.com/uploadcare/uploadcare-ckeditor.git plugins/uploadcare --recursive

Find a "config.js" file an edit it:

    var UPLOADCARE_PUBLIC_KEY = "demopublickey";

Initialize a CKEDITOR plugin with additional params:

    <script>
      CKEDITOR.replace( 'editor1', {
        extraPlugins: 'uploadcare', // this will enable plugin
        toolbar: [
          [ 'Bold', 'Italic', '-', 'NumberedList', 'BulletedList', '-', 'Link', 'Unlink', '-', 'Uploadcare' ]
        ]
      });

    </script>

## PHP (Optional)

Find a "config.js" file and edit it:
  
    var USE_PHP = true;

Find a "config.php" file inside plugin directory and edit it:

    <?php
    define('UC_PUBLIC_KEY', 'demopublickey');
    define('UC_SECRET_KEY', 'demoprivatekey');

PHP Version provides an outdated custom dialog. This dialog is used to store files and images and 
provides some additional image operations.

## Usage

### if USE_PHP = false

1. Press "Uploadcare" button.
2. Select a file to upload and press "Upload"
3. Wait for file to be uploaded.
4. Crop an image as you wish.
5. Press "Upload" again. A cropped image will be available inside editor.

### If USE_PHP = true

1. Press "Uploadcare" button.
2. Select a file to upload.
3. Wait for file to be uploaded. An "Uploadcare" icon will show upload progress.
4. Change any parameters you like.
5. Press "Insert" and an image will be available inside editor.
 
[1]: http://uploadcare.com/
[2]: https://uploadcare.com/documentation/reference/basic/cdn.html
[3]: https://github.com/uploadcare/uploadcare-php
[4]: http://www.ckeditor.com
[5]: http://www.ckeditor.com/addon/iframedialog