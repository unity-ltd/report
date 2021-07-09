think.messenger.on('broadcast', data => {
  //所有进程都会捕获到该事件，包含当前的进程
  console.log('from master.js: broadcast', data)
});

// src/bootstrap/worker.js
think.messenger.on('consume', (data) => {
  console.log('from master.js: consume', data)
});

// src/bootstrap/worker.js
think.messenger.on('map', (data) => {
  console.log('from master.js: map', data)
});

