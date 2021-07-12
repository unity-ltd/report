import moment from 'moment'

think.messenger.on('broadcast', data => {
  //所有进程都会捕获到该事件，包含当前的进程
  console.log('from worker.js: broadcast')
});

// src/bootstrap/worker.js
think.messenger.on('create', async data => {
  const reportor = think.service('generateReport')
  if (reportor && reportor.writeReport) {
    await reportor.writeReport(data);
  }
  console.log('from worker.js: create failed because of error')
});

think.messenger.on('issue', async data => {
  const issuer = think.service('issueReport')
  if (issuer && issuer.issueReport) {
    await issuer.issueReport(data);
  }
  console.log('from worker.js: issue failed because of error')
});
