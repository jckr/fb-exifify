#!/usr/bin/env node
const { readFile, writeFile } = require('fs');
const {resolve} = require('path');
const { parse } = require('node-html-parser');
const exiftool = require('node-exiftool');
const exiftoolBin = require('dist-exiftool');

const ExifTagsToFB = {
  DateTimeOriginal: 'Taken',
  ModifyDate: 'Taken',
  Exposure: 'Exposure',
  FocalLength: 'Focal Length',
  FNumber: 'F-Stop',
  ISO: 'ISO Speed',
  ModifyDate: 'Taken',
  GPSLatitude: 'Latitude',
  GPSLatitudeRef: 'Latitude',
  GPSLongitude: 'Longitude',
  GPSLongitudeRef: 'Longitude'
};

function formatDate(dateString) {
  // YYYY-MM-DD hh:mm:ss
  return new Date(dateString)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19);
}

!(function() {
  const htmlFile = process.argv[2];
  if (!htmlFile || htmlFile === '--help' || htmlFile === '-h' || htmlFile ==='/?') {
    console.log(`usage:
    exifify PATH
    where PATH is the path to the html file of the album that contains pictures you want to add EXIF information to, ie:
    
    'exifify /Users/jerome/Downloads/facebook-jeromecukier/photos_and_videos/photos_synced_from_your_device.html`);
    return;
  }
  let cardIdx = 0;
  readFile(htmlFile, { encoding: 'utf-8' }, (err, rawHtml) => {
    if (err) {
      throw err;
    }
    const root = parse(rawHtml);
    const main = root.querySelector('[role="main"]');
    const cards = main.childNodes;

    const data = cards.reduce((prev, card) => {
      const src = path.resolve(htmlFile, '../../', card.querySelector('img').attributes.src);
      const table = card.querySelector('table');
      const Taken = formatDate(card.querySelectorAll('div')[1].innerHTML);
      let exif = { Taken };
      if (table) {
        exif = table.querySelectorAll('tr').reduce((result, row) => {
          const tds = row.querySelectorAll('td');
          if (tds.length === 2) {
            const key = tds[0].querySelector('div').innerHTML;
            const value = tds[1].querySelector('div').innerHTML;
            if (value.length) {
              switch (key) {
                case 'Taken':
                  result[key] = formatDate(value);
                  break;
                case 'F-Stop':
                  [n, d] = value.split('/').map(Number);
                  result[key] = n / d;
                  break;
                default:
                  result[key] = value;
              }
            }
          }
          return result;
        }, exif);
      } else {
        console.log(`no metadata found for picture uploaded on ${Taken}`);
      }

      prev.push({ src, exif });
      return prev;
    }, []);
    console.log(`${data.length} pictures parsed`);
    injectData(data);
  });
})();

function injectData(data) {
  const ep = new exiftool.ExiftoolProcess(exiftoolBin);

  ep.open()
    .then(() => {
      data.forEach((d, i) => {
        const exifMeta = Object.entries(ExifTagsToFB).reduce(
          (prev, [exifTag, FBproperty]) => {
            prev[exifTag] = d.exif[FBproperty];
            return prev;
          },
          {}
        );
        console.log(i, d.src, JSON.stringify(exifMeta), [
          'overwrite_original'
        ]);
        ep.writeMetadata(d.src, exifMeta, ['overwrite_original']);
      });
    })
    .then(console.log, console.error)
    .then(() => ep.close())
    .catch(console.error);
}
