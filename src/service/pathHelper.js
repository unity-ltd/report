import { existsSync, copyFileSync, mkdirSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { unix } from 'moment';
import { think } from 'thinkjs';
import { config } from 'dotenv';
import { setGracefulCleanup } from 'tmp';

setGracefulCleanup();
config();

export default class extends think.Service {
  getFilename(file_url) {
    // console.log({getFilename:file_url})
    let s = file_url.split('\\').pop();
    if (s) file_url = s;
    s = file_url.split('/').pop();
    if (s) file_url = s;
    return file_url;
  }

  getFileExt(file_url) { return file_url.split('.').pop(); }

  getLocalPath(task, fileType, filename) {
    if (filename) {
      filename = this.getFilename(filename);
    }
    const prefix = process.env.S3_URL;

    const fullPath = this._getPathOnS3(prefix, task, fileType, filename || task.report_file);
    const targetDir = dirname(fullPath);
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }
    return fullPath;
  }

  getLocalTmpPath(task, fileType, filename) {
    if (filename) {
      filename = this.getFilename(filename);
    }
    const prefix = '/tmp/';

    const fullPath = this._getPathOnS3(prefix, task, fileType, filename || task.report_file);
    const targetDir = dirname(fullPath);
    if (!existsSync(targetDir)) {
      console.log('mkdir', targetDir);
      mkdirSync(targetDir, { recursive: true });
    }
    console.log('return', fullPath);
    return fullPath;
  }

  moveFile(tmpPath, parementPath) {
    if (existsSync(tmpPath)) {
      copyFileSync(tmpPath, parementPath);
      unlinkSync(tmpPath);
    }
  }

  getGlobalPath(task, filename) {
    if (filename) {
      filename = this.getFilename(filename);
    }
    const prefix = process.env.DOC_URL;
    const fileType = filename? 'images': 'reports';
    return this._getPathOnS3(prefix, task, fileType, filename || task.report_file);
  }


  _getPathOnS3(prefix, task, fileType, filename) {
    const { house_id, title, timestamp } = task;
    const dateDir = unix(timestamp).format('YYYY-MM-DD');
    const targetDir = join(`${house_id}`, title, dateDir, fileType);
    if (!filename) {
      return prefix + targetDir;
    }
    filename = this.getFilename(filename);
    const targetPath = join(targetDir, filename);
    return prefix + targetPath;
  }

  getThrumbnailPath(task, img) {
    const prefix = process.env.S3_URL;
    return this._getPathOnS3(prefix, task, 'thumbnails', img);
  }

}
