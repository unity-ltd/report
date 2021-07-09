import fs from 'fs';
import { think } from 'thinkjs';
import libre from 'libreoffice-convert';

export default class extends think.Service {

  async convertPDF(localPath) {
    const enterPath = localPath;
    const extend = '.pdf';
    const outputPath = localPath.substr(0, localPath.lastIndexOf(".")) + extend;

    // console.log('convertPDF: Written', {outputPath});
    // Read file
    if (!fs.existsSync(enterPath)) {
      throw { message: `convertPDF: ${enterPath} doesn't exist`};
    }
    const tmpfile = '/tmp/1';
    const src = tmpfile + ".docx";
    const dst = tmpfile + ".pdf";
    fs.copyFileSync(enterPath, src);

    // Convert it to pdf format with undefined filter (see Libreoffice doc about filter)
    return new Promise((resolve, reject) => {
      console.log('convertPDF: libre.convert', {src, dst});
      try {
        const file = fs.readFileSync(src);
        console.log('fs.readFileSync', {src});
        libre.convert(file, extend, undefined, (err, done) => {
          if (err) {
            console.log(`Error converting file: ${err}`);
            reject(err);
          }
          fs.writeFileSync(dst, done);
          // console.log('convertPDF: Write to tmp', {dst});
          if (fs.existsSync(dst)) {
            // console.log('convertPDF: Written', {dst});
            fs.copyFileSync(dst, outputPath)
            resolve(outputPath);
          } else {
            console.log(`Error converting file: ${err}`);
            reject({message: `Error converting file: ${err}`});
          }
        });
      } catch (error) {
        console.log('error in convertPDF', {error})
        reject(error)
      }
    });
  }
}
