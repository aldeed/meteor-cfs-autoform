Package.describe({
  name: "cfs:autoform",
  version: "2.2.1",
  summary: "Upload files as part of autoform submission",
  git: "https://github.com/aldeed/meteor-cfs-autoform.git"
});

Package.onUse(function(api) {
  api.use('underscore@1.0.1', 'client');
  api.use('templating@1.0.9', 'client');

  api.use('aldeed:autoform@4.0.0 || 5.0.0');
  api.use('cfs:standard-packages@0.0.2', ['client', 'server'], {weak: true});
  api.use('raix:ui-dropped-event@0.0.7', 'client');

  // ensure standard packages are available globally incase the user didn't `meteor add cfs:standard-packages`
  api.imply('cfs:standard-packages');

  api.export('CfsAutoForm', 'client');

  api.add_files([
    'cfs-autoform.html',
    'cfs-autoform-hooks.js',
    'cfs-autoform-util.js',
    'cfs-autoform.js',
    'cfs-autoform.css'
  ], 'client');
});
