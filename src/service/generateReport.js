'use strict';
import fs from 'fs'
import officegen from 'officegen';
import { think } from 'thinkjs';
import axios from 'axios'
import moment from 'moment'

module.exports = class extends think.Service {

  async writeReport(dataForReport) {
    console.log("writeReport", dataForReport)
    const { account, task, contacts, askedConvertToPDF } = dataForReport
    const pathHelper = think.service('pathHelper');

    const docxInstance = officegen('docx');
    docxInstance.on('error', (err) => {
      console.log(`Error in ${task.title} reporting`, err);
    });
    docxInstance.on('finalize', async (written) => {
      console.log(`Finish to create ${task.title} report for ${task.id, task.timestamp}(${written} bytes)\n`);
    });

    await this.writeReportContent(docxInstance, dataForReport)

    task.report_file = `${moment().unix()}.docx`
    const reportPath = await pathHelper.getLocalPath(task, 'reports')
    const reportTmpPath = await pathHelper.getLocalTmpPath(task, 'reports')
    // pathHelper.update(account, task)

    const out = fs.createWriteStream(reportTmpPath);
    out.on('close', async () => {
      console.log('archve.close', {reportPath})
      pathHelper.moveFile(reportTmpPath, reportPath)
      try {
        const url = process.env.API_URL + 'task/reportDone';
        const response = await axios.post(url, task)
        if (response.data.errno !== 0) {
          throw response.data
        }
      } catch (error) {
        return ({errno: 1000, data: error});
      }

      if (contacts && contacts.length > 0) {
        const issueReport = think.service('issueReport')
        if (issueReport && issueReport.issueReport) {
          console.log('find issueReport.issueReport', {task})
          issueReport.issueReport(dataForIssue)
        }
      }
    });
    console.log("docxInstance.generate")
    docxInstance.generate(out);
    return ({errno: 0, data: reportPath});
  }

  async writeReportContent(docxInstance, dataForReport) {
    const { task } = dataForReport
    const writeReport = this.getReportingService(task, 'writeReport')
    return await writeReport.writeReport(docxInstance, dataForReport)
  }

  getReportingService(task, module) {
    if (!module) {
      module = 'misc'
    }
    let reportServiceName = '';
    switch(task.title) {
      case 'hhs':
        reportServiceName = `hhsReport-${module}`;
        break;
      case 'inspections':
        reportServiceName = `inspectionReport-${module}`;
        break;
      }
		return reportServiceName? think.service(reportServiceName): null;
  }
}
