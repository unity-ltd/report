export default class extends think.Controller {
  indexAction() {
    return this.success('Service port is READY')
  }

  async createAction() {
    const data = this.post()
    think.messenger.consume('create', data);
    this.success(data.task.id)
  }

  async issueAction() {
    const data = this.post()
    think.messenger.consume('issue', data);
    this.success(data.task.id)
  }
};
