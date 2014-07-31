Package.describe({
  name: "cfs-autoform",
  summary: "Upload files as part of autoform submission"
});

Package.on_use(function(api) {
  api.use(['autoform', 'underscore', 'collectionFS', 'templating', 'ui-dropped-event']);

  api.add_files(['cfs-autoform.html', 'cfs-autoform.js', 'cfs-autoform.css'], 'client');
});