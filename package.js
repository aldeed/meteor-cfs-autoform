Package.describe({
  name: "cfs:autoform",
  version: "2.0.0-rc1",
  summary: "Upload files as part of autoform submission",
  git: "https://github.com/aldeed/meteor-cfs-autoform.git"
});

Package.on_use(function(api) {
  api.versionsFrom('METEOR@0.9.3');
  api.use(['underscore', 'templating'], 'client');

  api.use('aldeed:autoform@4.0.0-rc1');
  api.use('cfs:standard-packages@0.0.2');
  api.use('raix:ui-dropped-event@0.0.7', 'client');

  api.add_files(['cfs-autoform.html', 'cfs-autoform.js', 'cfs-autoform.css'], 'client');
});