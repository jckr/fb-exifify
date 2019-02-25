# fb-exifify
small tool to but EXIF information back into pictures from Facebook archive.

## Usage:

install the tool from github or npm,

run yarn or npm install to install dependencies,

exifify + the path to an HTML file with photos in your Facebook archive, ie:

exifify /Users/jerome/Downloads/facebook-jeromecukier/photos_and_videos/photos_synced_from_your_device.html

Exifify will get the information from the HTML file, such as longitude, latitude, camera model etc. 
It will use the date listed in the HTML file for each picture as the date the picture was taken, failing that, it will use the date at which the picture was uploaded - which is always available.

Exifify will modify your pictures directly. You should make a copy beforehand just in case, then again you can probably download your Facebook archive again.
