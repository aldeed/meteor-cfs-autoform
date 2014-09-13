Package.describe({
  name: "cfs:autoform",
  version: "1.0.0",
  summary: "Upload files as part of autoform submission",
  git: "https://github.com/aldeed/meteor-cfs-autoform.git"
});

Package.on_use(function(api) {
  if (api.versionsFrom) {
    api.versionsFrom('METEOR@0.9.1');
    api.use(['underscore', 'templating'], 'client');

    api.use('aldeed:autoform@2.0.1');
    api.use('cfs:standard-packages@0.0.2');
    api.use('raix:ui-dropped-event@0.0.7', 'client');
  } else {
    api.use(['autoform', 'underscore', 'collectionFS', 'templating', 'ui-dropped-event']);
  }

  api.add_files(['cfs-autoform.html', 'cfs-autoform.js', 'cfs-autoform.css'], 'client');
});