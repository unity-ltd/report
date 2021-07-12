'use strict';
import axios from 'axios'
import moment from 'moment';
import { think } from 'thinkjs';

module.exports = class extends think.Service {
  async issueReport({task, contacts, askedConvertToPDF}) {
    console.log('issueReport.contacts', {contacts})
    if (!contacts || !contacts.length) {
      throw { message: 'No receipts to issue'};
    }
    const pathHelper = think.service('pathHelper')
    let localPath = pathHelper.getLocalPath(task, 'reports');
    if (!localPath) {
      console.log('throw', { message: 'No report to issue'})
      throw { message: 'No report to issue'};
    }
    if (typeof askedConvertToPDF == 'undefined') {
      askedConvertToPDF = task.title === 'hhs';
    }

    const convertor = think.service('convertPDF');
    let ext = pathHelper.getFileExt(localPath);
    if (convertor && convertor.convertPDF && askedConvertToPDF) {
      if (ext.toLowerCase() === 'docx' || ext.toLowerCase() === 'doc') {
        console.log(`Converting doc to pdf`)
        const start = moment().unix()
        localPath = await convertor.convertPDF(localPath);
        ext = 'pdf'
        const end = moment().unix()
        console.log(`convertor.convertPDF ${end-start} seconds`, {localPath})
      }
    }

    const { title, timestamp, house } = task;
    const { unit, num, street } = house;
    const address = unit?`${unit}/${num} ${street}`: `${num} ${street}`;
    const subject = `${address}-${title} report on ${moment.unix(timestamp).format('DD MMM YYYY')}`;
    const attachmentName = `${subject}.${ext}`

    const mailService = think.service('sendMail');
    const transport = mailService.getTransport().inspection;
    const sentContacts = [];
    for (const contact of contacts) {
      if (contact && contact.email) {
        const options = {
          from: 'Unity Property Management',
          to: contact.email,
          subject: subject,
          html:
          `<H2>Dear ${contact.name},</H2>` +
          '<br><h3>An inspection has been conducted to your property. The report is in the attachment.</h3>' +
            '<br> <h3>Kind Regards,Your property manager</h3>' +
            '<br><br> <p>This email is automatically sent from our website.</p>' +
            '<br><br> <p>Please don\'t reply to the sender.</p>',
          attachments: [
            {
              filename: attachmentName,
              path: localPath,
            },
          ],
        };
        try {
          const start = moment().unix()
          const res = await mailService.sendAsync(transport, options);
          const end = moment().unix()
          console.log(`${attachmentName} sent to ${contact.email}in ${end-start} seconds`);
          sentContacts.push(contact);
        } catch (error) {
          console.log(`Failed to send Inspection`, error);
        }
      }
    }
    try {
      const url = process.env.API_URL + 'task/reportSent';
      const response = await axios.post(url, {
        task_id: task.id,
        contacts: sentContacts
      })
      if (response.status >= 400) {
        throw response.data
      }
      console.log('task/reportSent successfully')
    } catch (error) {
      console.log({errno: 1000, data: error})
      return ({errno: 1000, data: error});
    }
  }
}
