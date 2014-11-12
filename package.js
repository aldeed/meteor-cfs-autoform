Package.describe({
  name: "cfs:autoform",
  version: "2.0.0",
  summary: "Upload files as part of autoform submission",
  git: "https://github.com/aldeed/meteor-cfs-autoform.git"
});

Package.on_use(function(api) {
  api.use('underscore@1.0.1', 'client');
  api.use('templating@1.0.9', 'client');

  api.use('aldeed:autoform@4.0.0');
  api.use('cfs:standard-packages@0.0.2', ['client', 'server'], {weak: true});
  api.use('raix:ui-dropped-event@0.0.7', 'client');

  api.add_files(['cfs-autoform.html', 'cfs-autoform.js', 'cfs-autoform.css'], 'client');
});