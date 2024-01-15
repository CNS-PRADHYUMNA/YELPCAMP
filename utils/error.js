class error extends Error {
  constructor(msg, status) {
    super();
    this.msg = msg;
    this.status = status;
  }
}

module.exports = error;
