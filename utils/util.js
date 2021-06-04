class Util {

  constructor() {
    this.validUpdate = this.validUpdate.bind(this);
  }

  validUpdate(allowedUpdates=[], upateRequired={}) {
    const updates = Object.keys(upateRequired);
    const validUpdate = updates.every((update) =>
      allowedUpdates.includes(update)
    );
    return validUpdate;
  }
}

module.exports = new Util();
