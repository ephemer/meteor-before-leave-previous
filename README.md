# Iron Router beforeLeavePrevious

IronRouter provides us with plenty of options to hook into the loading of a new template once the old one has been unloaded, but nothing to allow us to hook into (and potentially block) navigation before unloading the old template.

This beforeLeavePrevious package allows you to stop navigation to a particular page (or any page) until all the hooks have been satisfied (return true). The package's original use case was to display a `bootstrap.js` modal that prompts for payment before navigating to a restricted area of the app.

The package can also be useful for other asynchronous confirm / subscribe dialogue boxes and animation hooks (i.e. the animations must complete and return ready before navigation begins). It is designed for use with reactive functions that conditionally return true. If you just want to run some code before changing routes you should use one of the inbuilt unload hooks or onBeforeAction etc.

**Important** beforeLeavePrevious hooks have no effect on a route that is loaded by directly inputting its URL / arriving via an external link. It only takes effect when navigating via Router.go() – including all a[href] links – within your app. If you want to perform the same checks upon loading the new route, reference your beforeLeavePrevious function in your route's onBeforeAction hook.

```
var myBeforeLeavePrevious = function() {
	return Session.equals("dontNavigateUntilIReturn", true);
}

Router.map(function(){
	// Set up a hook for a particular route
	this.route("route1", {
		template: "template",
		beforeLeavePrevious: myBeforeLeavePrevious
	}
})

MyRouteController = RouteController.extend({
	// Affects all routes attached to this route controller
	beforeLeavePrevious: function () {
		return Meteor.user().subscription.payment_status === "ok";
	}
});

Router.beforeLeavePrevious = function () {
	// The router will do this before navigating to ANY internal route

	// Do some animation, tracking or cleanup code here

	return true; // You must always return a value
};
```

## Usage

Add a hook to a route, controller, or globally, as in the examples above. A hook should either create a reactive context, e.g. include Session.get() or Cursor.find() etc., a future (as yet untested), or just literally `return true`. Once all hooks are satisfied the Router will automatically navigate to the requested page.