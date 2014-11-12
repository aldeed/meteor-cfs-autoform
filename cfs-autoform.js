if (Meteor.isClient) {

  // Adds a custom "cfs-file" input type that AutoForm will recognize
  AutoForm.addInputType("cfs-file", {
    template:"cfsFileField",
    valueOut: function () {
      return "dummyId";
    },
    contextAdjust: function (context) {
      context.atts.placeholder = context.atts.placeholder || "Click to upload a file or drop it here";
      context.atts["class"] = (context.atts["class"] || "") + " cfsaf-field";
      return context;
    }
  });

  // Adds a custom "cfs-files" input type that AutoForm will recognize
  AutoForm.addInputType("cfs-files", {
    template:"cfsFilesField",
    valueOut: function () {
      return ["dummyId"];
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

  var singleHandler = function (event, template) {
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
    'change .cfsaf-hidden': singleHandler,
    'dropped .cfsaf-field': singleHandler
  });

  var multipleHandler = function (event, template) {
    // Get the FileList object from the event object
    var fileList = event.originalEvent.dataTransfer ? event.originalEvent.dataTransfer.files : event.currentTarget.files;
    
    // Store the FileList on the file input for later. We store an array of
    // separate FileList objects. Browsers don't let you add/remove items from
    // an existing FileList.
    var fileListList = template.$('.cfsaf-hidden').data("cfsaf_files_multi") || [];
    fileListList.push(fileList);
    template.$('.cfsaf-hidden').data("cfsaf_files_multi", fileListList);

    // Get full list of files to display in the visible, read-only field
    var fullNameList = [];
    _.each(fileListList, function (fileList) {
      _.each(fileList, function (f) {
        fullNameList.push(f.name);
      });
    });
    template.$('.cfsaf-field').val(fullNameList.join(", "));
  };

  Template["cfsFilesField_bootstrap3"].events({
    'click .cfsaf-field': function (event, template) {
      template.$('.cfsaf-hidden').click();
    },
    'change .cfsaf-hidden': multipleHandler,
    'dropped .cfsaf-field': multipleHandler
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

          // Loop through all hidden file inputs in the form.
          var totalFiles = 0;
          var arrayFields = {};
          template.$('.cfsaf-hidden').each(function () {
            var elem = $(this);

            // Get schema key that this input is for
            var key = elem.attr("data-schema-key");

            // no matter what, we want to delete the dummyId value
            delete doc[key];

            // Get list of files that were attached for this key
            var fileList = elem.data("cfsaf_files");

            // If we have some attached files
            if (fileList) {
              // add all files to total count
              totalFiles += fileList.length;
            }

            // Otherwise it might be a multiple files field
            else {
              var fileListList = elem.data("cfsaf_files_multi");
              if (fileListList) {
                // make a note that it's an array field
                arrayFields[key] = true;
                // add all files to total count
                _.each(fileListList, function (fileList) {
                  totalFiles += fileList.length;
                });
                // prep the array
                doc[key] = [];
              }
            }
          });

          // If no files were attached anywhere on the form, we're done.
          // We pass back the doc synchronously
          if (totalFiles === 0) {
            return doc;
          }
          
          // Create the callback that will be called either
          // upon file insert error or upon each file being uploaded.
          var doneFiles = 0;
          var failedFiles = 0;
          function cb(error, fileObj, key) {
            // Increment the done files count
            doneFiles++;

            // Increment the failed files count if it failed
            if (error) {
              failedFiles++;
            }

            // If it didn't fail, set the new ID as the property value in the doc,
            // or push it into the array of IDs if it's a multiple files field.
            else {
              if (arrayFields[key]) {
                doc[key].push(fileObj._id);
              } else {
                doc[key] = fileObj._id;
              }
            }

            // If this is the last file to be processed, pass execution back to autoform
            if (doneFiles === totalFiles) {
              // If any files failed
              if (failedFiles > 0) {
                // delete all that succeeded
                deleteUploadedFiles(template);
                // pass back to autoform code, telling it we failed
                self.result(false);
              }
              // Otherwise if all files succeeded
              else {
                // pass updated doc back to autoform code, telling it we succeeded
                self.result(doc);
              }
            }
          }

          // Loop through all hidden file fields, inserting
          // and uploading all files that have been attached to them.
          template.$('.cfsaf-hidden').each(function () {
            var elem = $(this);

            // Get schema key that this input is for
            var key = elem.attr("data-schema-key");

            // Get the FS.Collection instance
            var fsCollectionName = elem.attr("data-cfs-collection");
            var fsCollection = FS._collections[fsCollectionName];

            // Loop through all files that were attached to this field
            function loopFileList(fileList) {
              _.each(fileList, function (file) {
                // Create the FS.File instance
                var fileObj = new FS.File(file);

                // Listen for the "uploaded" event on this file, so that we
                // can call our callback. We want to wait until uploaded rather
                // than just inserted. XXX Maybe should wait for stored?
                fileObj.once("uploaded", function () {
                  // track successful uploads so we can delete them if any
                  // of the other files fail to upload
                  var uploadedFiles = elem.data("cfsaf_uploaded-files") || [];
                  uploadedFiles.push(fileObj);
                  elem.data("cfsaf_uploaded-files", uploadedFiles);
                  // call callback
                  cb(null, fileObj, key);
                });

                // Insert the FS.File instance into the FS.Collection
                fsCollection.insert(fileObj, function (error, fileObj) {
                  // call callback if insert/upload failed
                  if (error) {
                    cb(error, fileObj, key);
                  }
                  // TODO progress bar during uploads
                });
              });
            }

            // single fields first
            loopFileList(elem.data("cfsaf_files"));
            // then multiple fields
            _.each(elem.data("cfsaf_files_multi"), function (fileList) {
              loopFileList(fileList);
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
            elems.removeData("cfsaf_files_multi");
          }
          // cleanup uploaded files data
          elems.removeData("cfsaf_uploaded-files");
        }
      }
    });
  }
}