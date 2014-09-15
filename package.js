Package.describe({
  summary: "Stop IronRouter from navigating until all beforeLeavePrevious functions return true",
  version: "1.0.1",
  git: "https://github.com/ephemer/meteor-before-leave-previous"
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@0.9.0');
  api.use(['iron:router@0.9.0', 'underscore'], 'client');
  api.addFiles('ephemer:before-leave-previous.js', 'client');
});
