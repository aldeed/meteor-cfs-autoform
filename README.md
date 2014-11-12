cfs:autoform
=========================

A smart package for Meteor that provides a file UI component for use within an autoform. The UI component supports clicking to select files or dropping them. Once the full form is valid, the files are uploaded using CollectionFS. The form document is inserted only if the uploads are all successful. If the form document fails to insert on the server, the uploaded files are removed.

## Installation

In a Meteor app directory, enter:

```
$ meteor add cfs:autoform
```

## Prerequisites

Requires Meteor 0.9.3+

Add `aldeed:collection2`, `aldeed:autoform`, and `cfs:standard-packages` packages to your app. Also add any other CFS packages you need, particularly a storage adapter package such as `cfs:gridfs`.

## Example

*Assumption: autopublish, insecure, and cfs:gridfs packages are in use*

*common.js*

```js
Docs = new Meteor.Collection("docs");
Docs.attachSchema(new SimpleSchema({
  name: {
    type: String
  },
  fileId: {
    type: String
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
  {{> afQuickField name="fileId" type="cfs-file" collection="files"}}
  <button type="submit">Submit</button>
  {{/autoForm}}
</template>
```

## Schema Example

If you are not able to change the `afQuickField` attributes directly or you want to use a `quickForm`, you can put the attributes in the schema instead:

```js
Docs.attachSchema(new SimpleSchema({
  name: {
    type: String
  },
  fileId: {
    type: String,
    autoform: {
      afFieldInput: {
        type: "cfs-file",
        collection: "files"
      }
    }
  }
}));
```

## Notes

* Only insert forms (`type="insert"`) are supported
* Use `type="cfs-file"` to allow one file to be selected or dropped. Use `type="cfs-files"` to allow multiple files to be selected or dropped.
* The `collection` attribute must be the same as the first argument you passed to the FS.Collection constructor.
* Files are uploaded only after you click submit and the form is valid.
* If file upload fails, the form document is not inserted.
* If one file fails to upload, any other files from that form that did upload are deleted.
* If the form document insert fails on the server, the associated files are automatically deleted as part of the latency compensation rollback.

## TODO

* Insert FS.File itself when using cfs-ejson-file package.
* Display customizable progress bar template in place of each field while uploading.
* Update forms

[![Support via Gratipay](https://cdn.rawgit.com/gratipay/gratipay-badge/2.1.3/dist/gratipay.png)](https://gratipay.com/aldeed/)
