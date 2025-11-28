class HandleUploads {
  static handleFileUploads(body, files) {
    if (files) {
      files.forEach((file) => {
        const keys = file.fieldname.replace(/\]/g, "").split(/\[/);
        let current = body;

        keys.forEach((key, index) => {
          if (index === keys.length - 1) {
            current[key] = file.filename;
          } else {
            if (!current[key]) {
              current[key] = isNaN(keys[index + 1]) ? {} : [];
            }
            current = current[key];
          }
        });
      });
    }
    return body;
  }
}

module.exports = HandleUploads;
