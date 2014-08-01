cfs-autoform
=========================

WORK IN PROGRESS

A smart package for Meteor that provides a file UI component for use within an autoform. The UI component supports clicking to select files or dropping them. Once the full form is valid, the files are uploaded using CollectionFS. The form document is inserted only if the uploads are all successful. If the form document fails to insert on the server, the uploaded files are removed.

## Installation

Work in progress. For now, not on Atmosphere. Put this in the packages section of your smart.json:

```
"cfs-autoform": {
  "git": "https://github.com/aldeed/meteor-cfs-autoform",
  "branch": "master"
}
```
And then run `mrt add cfs-autoform`

## Prerequisites

Add `autoform` and `collectionFS` packages to your app. Also add any other CFS packages you need, particularly a storage adapter package.

## Example

*Assumption: autopublish, insecure, and cfs-gridfs packages are in use*

*common.js*

```js
Docs = new Meteor.Collection("docs");
Docs.attachSchema(new SimpleSchema({
  name: {
    type: String
  },
  fileId: {
    type: String,
    label: "File"
  }
}));

Files = new FS.Collection("files", {
  stores: [new FS.Store.GridFS("filesStore")]
});

Files.allow({
  download: function () {
    return true;
  },
  fetch: null
});
```

*html:*

```html
<template name="insertForm">
  {{#autoForm id="insertForm" type="insert" collection="Docs"}}
  {{> afQuickField name="name"}}
  {{> cfsFileField name="fileId" collection="files"}}
  <button type="submit">Submit</button>
  {{/autoForm}}
</template>
```

## Notes

* Only insert forms (`type="insert"`) are supported
* The `collection` attribute for `cfsFileField` must be the same as the first argument you passed to the FS.Collection constructor.
* Files are uploaded only after you click submit and the form is valid.
* If file upload fails, the form document is not inserted.
* If one file fails to upload, any other files from that form that did upload are deleted.
* If the form document insert fails on the server, the associated files are automatically deleted as part of the latency compensation rollback.

## TODO

* Insert FS.File itself when using cfs-ejson-file package.
* Display customizable progress bar template in place of each field while uploading.
* Better template/component structure so that it does not have to be a quickField.

[![Support via Gittip](https://rawgithub.com/twolfson/gittip-badge/0.2.0/dist/gittip.png)](https://www.gittip.com/aldeed/)
