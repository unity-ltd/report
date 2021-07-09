'use strict';
import { lookup } from 'mime-types';
import { config } from 'dotenv';
config();

export default class extends think.Service {

    getTransport() {
        return {
            'xp': {
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    user: 'report.unityproperty@gmail.com',
                    pass: 'Unityltd7171+'
                }
            },
            'inspection': {
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                  user: 'report.unityproperty@gmail.com',
                  pass: 'Unityltd7171+'
                }
            }
        }
    }

    send (transport, options, s_callback, f_callback) {
      const stopEmailing = process.env.STOP_EMAILING;
      if (stopEmailing) {
        options.subject = `(test TO:${options.to}) ${options.subject}`;
        options.to = 'itsupport@unityltd.co.nz';
        options.cc = '';
        options.bcc = '';
      }

      // Auto recognize and set contentType for attachments
      if (typeof options.attachments != 'undefined' && options.attachments.length > 0) {
          // Auto recognize and set contentType for attachments
          for (let att of options.attachments) {
              let mimeType = lookup(att.filename)
              if (mimeType) {
                  att.contentType = mimeType
              }
          }
      }

      // to prevent disturbing the real owner
      if (think.env === 'development' && options.cc !== '') {
          options.to = options.cc
      }

      const res = think.sendEmail(transport, options)
      .then(info => s_callback(transport, options),
            error => f_callback(transport, options, error)
       );
    }

    sendAsync(transport, options) {
      return new Promise((resolve, reject) => {
        this.send(transport, options, resolve, reject)
      })
    }
}
