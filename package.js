Package.describe({
  summary: "Stop IronRouter from navigating until all beforeLeavePrevious functions return true",
  version: "1.1.0",
  git: "https://github.com/ephemer/meteor-before-leave-previous",
  name: "ephemer:before-leave-previous"
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.0');
  api.use(['iron:router@1.0.0', 'underscore'], 'client');
  api.addFiles('ephemer:before-leave-previous.js', 'client');
});
