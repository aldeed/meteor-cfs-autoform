if (Meteor.isClient) {
  Template.cfsFileField.helpers({
    qfAtts: function () {
      var atts = _.clone(this);
      atts.type = "text";
      atts.readonly = true;
      var defaultPlaceholder = atts.multiple ? "Click to upload files or drop them here" : "Click to upload a file or drop it here";
      atts.placeholder = atts.placeholder || defaultPlaceholder;
      atts["class"] = atts["class"] || "";
      atts["class"] = atts["class"] + " cfsaf_field";
      delete atts.collection;
      delete atts.multiple;
      return atts;
    },
    inputAtts: function () {
      var self = this;
      return {
        type: "file",
        "data-cfs-schema-key": self.name,
        "data-cfs-collection": self.collection,
        multiple: self.multiple
      };
    }
  });

  function findAFData() {
    var i = 1, af;
    do {
      af = UI._parentData(i);
      i++;
    } while (af && !af._af);
    return af ? af._af : null;
  }

  var hookTracking = {};
  Template.cfsFileField.rendered = function () {
    var d = findAFData();
    if (!d) {
      throw new Error("cfsFileField must be used within an autoForm block");
    }
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
    template.$('[data-schema-key]').val(fileList.join(", "));
    var fileList = event.originalEvent.dataTransfer ? event.originalEvent.dataTransfer.files : event.currentTarget.files;
    // Store the FileList on the file input for later
    $('[data-cfs-schema-key]').data("cfsaf_files", fileList);
  };

  Template.cfsFileField.events({
    'click [data-schema-key]': function (event, template) {
      template.$('[data-cfs-schema-key]').click();
    },
    'change [data-cfs-schema-key]': handler,
    'dropped [data-schema-key]': handler
  });

  function deleteUploadedFiles(template) {
    template.$('[data-cfs-schema-key]').each(function () {
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
          template.$('[data-cfs-schema-key]').each(function () {
            var elem = $(this);
            var files = elem.data("cfsaf_files");
            if (files) {
              totalFiles += files.length;
            }
            var key = elem.attr("data-cfs-schema-key");
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
              doc[key] = fileObj._id;
            }
            if (doneFiles === totalFiles) {
              if (failedFiles > 0) {
                deleteUploadedFiles(template);
                self.result(false);
              } else {
                self.result(doc);
              }
            }
          }

          template.$('[data-cfs-schema-key]').each(function () {
            var elem = $(this);
            var key = elem.attr("data-cfs-schema-key");
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
          var elems = template.$('[data-cfs-schema-key]');
          if (error) {
            deleteUploadedFiles(template);
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