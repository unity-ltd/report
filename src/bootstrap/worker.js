think.messenger.on('broadcast', data => {
  //所有进程都会捕获到该事件，包含当前的进程
  console.log('from worker.js: broadcast')
});

// src/bootstrap/worker.js
think.messenger.on('create', async data => {
  console.log('from worker.js: create')
  const reportor = think.service('generateReport')
  if (reportor && reportor.writeReport) {
    await reportor.writeReport(data);
  }
  console.log('"controller.create ends.')
  think.messenger.broadcast('broadcast', data.house_data );
});

think.messenger.on('issue', async data => {
  console.log('from worker.js: issue')
  const issuer = think.service('issueReport')
  if (issuer && issuer.issueReport) {
    await issuer.issueReport(data);
  }
  console.log('from worker.js: issue ends.')
  think.messenger.broadcast('broadcast', data.house_data );
});

// src/bootstrap/worker.js
think.messenger.on('map', (data) => {
  console.log('from worker.js: map', data)
});

