if (Meteor.isClient) {

  AutoForm.addInputType("cfs-file", {
    componentName:"cfsFileField",
    valueOut: {
      selector: 'input.cfsaf-file-field',
      get: function () {
        return "dummyId";
      }
    },
    contextAdjust: function (context) {
      context.atts.placeholder = context.atts.placeholder || "Click to upload a file or drop it here";
      context.atts["class"] = (context.atts["class"] || "") + " cfsaf-field";
      return context;
    }
  });

  AutoForm.addInputType("cfs-files", {
    componentName:"cfsFilesField",
    valueIsArray: true,
    valueOut: {
      selector: 'input.cfsaf-files-field',
      get: function () {
        return ["dummyId"];
      }
    },
    contextAdjust: function (context) {
      context.atts.placeholder = context.atts.placeholder || "Click to upload files or drop them here";
      context.atts["class"] = (context.atts["class"] || "") + " cfsaf-field";
      return context;
    }
  });

  function textInputAtts() {
    var atts = _.clone(this.atts);
    delete atts.collection;
    // we want the schema key tied to the hidden file field only
    delete atts["data-schema-key"];
    atts["class"] = (atts["class"] || "") + " form-control";
    return atts;
  }

  function fileInputAtts() {
    return {'data-schema-key': this.atts["data-schema-key"]};
  }

  Template["cfsFileField_bootstrap3"].helpers({
    textInputAtts: textInputAtts,
    fileInputAtts: fileInputAtts
  });

  Template["cfsFilesField_bootstrap3"].helpers({
    textInputAtts: textInputAtts,
    fileInputAtts: fileInputAtts
  });

  var hookTracking = {};
  Template["cfsFileField_bootstrap3"].rendered = 
  Template["cfsFilesField_bootstrap3"].rendered = function () {
    var d = AutoForm.find();
    // By adding hooks dynamically on render, hopefully any user hooks will have
    // been added before so we won't disrupt expected behavior.
    var formId = d.formId;
    if (!hookTracking[formId]) {
      hookTracking[formId] = true;
      addAFHook(formId);
    }
  };

  var handler = function (event, template) {
    var fileList = [];
    FS.Utility.eachFile(event, function (f) {
      fileList.push(f.name);
    });
    template.$('.cfsaf-field').val(fileList.join(", "));
    var fileList = event.originalEvent.dataTransfer ? event.originalEvent.dataTransfer.files : event.currentTarget.files;
    // Store the FileList on the file input for later
    template.$('.cfsaf-hidden').data("cfsaf_files", fileList);
  };

  Template["cfsFileField_bootstrap3"].events({
    'click .cfsaf-field': function (event, template) {
      template.$('.cfsaf-hidden').click();
    },
    'change .cfsaf-hidden': handler,
    'dropped .cfsaf-field': handler
  });

  Template["cfsFilesField_bootstrap3"].events({
    'click .cfsaf-field': function (event, template) {
      template.$('.cfsaf-hidden').click();
    },
    'change .cfsaf-hidden': handler,
    'dropped .cfsaf-field': handler
  });

  function deleteUploadedFiles(template) {
    template.$('.cfsaf-hidden').each(function () {
      var uploadedFiles = $(this).data("cfsaf_uploaded-files") || [];
      _.each(uploadedFiles, function (f) {
        f.remove();
      });
    });
  }

  function addAFHook(formId) {
    AutoForm.addHooks(formId, {
      before: {
        // We add a before.insert hook to upload all the files in the form.
        // This hook doesn't allow the form to continue submitting until
        // all the files are successfully uploaded.
        insert: function (doc, template) {
          var self = this;
          if (!AutoForm.validateForm(formId)) {
            return false;
          }

          var totalFiles = 0;
          template.$('.cfsaf-hidden').each(function () {
            var elem = $(this);
            var files = elem.data("cfsaf_files");
            if (files) {
              totalFiles += files.length;
            }

            // delete the dummyId value
            var key = elem.attr("data-schema-key");
            delete doc[key];
          });

          if (totalFiles === 0) {
            return doc;
          }
          
          var doneFiles = 0;
          var failedFiles = 0;
          function cb(error, fileObj, key) {
            doneFiles++;
            if (error) {
              failedFiles++;
            } else {
              // set real ID of uploaded file into the doc
              doc[key] = fileObj._id;
            }
            if (doneFiles === totalFiles) {
              if (failedFiles > 0) {
                // if any failed, we delete all that succeeded
                deleteUploadedFiles(template);
                // pass back to autoform code, telling it we failed
                self.result(false);
              } else {
                // pass updated doc back to autoform code, telling it we succeeded
                self.result(doc);
              }
            }
          }

          template.$('.cfsaf-hidden').each(function () {
            var elem = $(this);
            var key = elem.attr("data-schema-key");
            var fsCollectionName = elem.attr("data-cfs-collection");
            var files = elem.data("cfsaf_files");
            _.each(files, function (file) {
              var fileObj = new FS.File(file);
              fileObj.once("uploaded", function () {
                // track successful uploads so we can delete them if any
                // of the other files fail to upload
                var uploadedFiles = elem.data("cfsaf_uploaded-files") || [];
                uploadedFiles.push(fileObj);
                elem.data("cfsaf_uploaded-files", uploadedFiles);
                // call callback after uploaded, not just inserted
                cb(null, fileObj, key);
              });
              FS._collections[fsCollectionName].insert(fileObj, function (error, fileObj) {
                if (error) {
                  // call callback if insert/upload failed
                  cb(error, fileObj, key);
                }
                // TODO progress bar during uploads
              });
            });
          });
        }
      },
      after: {
        // We add an after.insert hook to delete uploaded files if the doc insert fails.
        insert: function (error, result, template) {
          var elems = template.$('.cfsaf-hidden');
          if (error) {
            deleteUploadedFiles(template);
            if (FS.debug || AutoForm._debug)
              console.log("There was an error inserting so all uploaded files were removed.", error);
          } else {
            // cleanup files data
            elems.removeData("cfsaf_files");
          }
          // cleanup uploaded files data
          elems.removeData("cfsaf_uploaded-files");
        }
      }
    });
  }
}