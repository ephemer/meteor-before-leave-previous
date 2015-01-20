var beforeLeavePreviousHooks = [];
// [{
//   path: "/path/:options",
//   callbacks: [func, func, func]
// }, {
//   path: ...,
//   callbacks: ...
// }]

// Run callbacks reactively and prevent navigation until all return true
var waitList = new Iron.WaitList();


var currentComputation;

Router.go = _.wrap(Router.go, function(originalGo) {
	var self = this;
	var args = _.toArray(arguments).slice(1); // remove originalGo fn

	waitList.stop();
    waitList = new Iron.WaitList;

	// ------------------------------------------------------------------------
	// Deal with different possibilities of calling Router.go()
	if(!args.length) return originalGo.apply(self);
	

	// Router.go() can also take a route name instead of a path
	var newRoute = Router.findFirstRoute(args[0]) // A URL
			 || Router.findFirstRoute(Router.path(args[0], args[1])) // Route name with optional params
	

	// Let IronRouter deal with it if we can't find a path
	if(!newRoute || !newRoute.options.path) return originalGo.apply(self, args);

	
	// Otherwise find the beforeLeavePrevious hooks for the route's path
	var pathHooksObj = _.findWhere(beforeLeavePreviousHooks, {"path": newRoute.options.path});
	if(typeof pathHooksObj !== "object") return originalGo.apply(self, args); // no hooks for this path

	// Prepare args for the beforeLeavePrevious hook:
	// 1. Pass any options for the new route as 'this'
	// 2. The route we're trying to '.go()' to
	// 3. The ('previous') route we're leaving from
	var newRouteOptions = args[1] || {};
	var hookArgs = [].concat(newRouteOptions, newRoute, Router.current().route);

	// Set up each function in the list to wait until ready
	_.each(pathHooksObj.callbacks, function eachWait (fn) {
		waitList.wait(Function.prototype.bind.apply(fn, hookArgs));
	});
	

	// Make sure we're only navigating to one page at a time
	if(currentComputation) currentComputation.stop();

	currentComputation = Deps.autorun(function (computation) {
		if(waitList.ready()){
			computation.stop();
			waitList.stop();
			originalGo.apply(self, args);
		}
	});

});


function addHook (path, fn) {
	var existingPathHook = _.findWhere(beforeLeavePreviousHooks, {"path": path});

	// Does this path have any hooks already?
	if(typeof existingPathHook === "object"){
		// existingPathHook is a _reference_
		existingPathHook.callbacks.push(fn);
	
	} else {
		// Add a new path
		beforeLeavePreviousHooks.push({
			path: path,
			callbacks: [fn]
		});
	}
}


function collectHooksFromRoute(name, options) {
	
	if(!options) return false;

	// Check whether Route has beforeLeavePrevious hook
	if(typeof options.beforeLeavePrevious === "function") {
		// console.log("beforeLeavePrevious from route", name, options);
		addHook(options.path, options.beforeLeavePrevious);
	}

	// Check whether Controller has beforeLeavePrevious hook
	if(	options.controller && 
		options.controller.prototype &&
		options.controller.prototype.beforeLeavePrevious &&
		typeof options.controller.prototype.beforeLeavePrevious === "function")
	{
		// console.log("beforeLeavePrevious from Controller", name, options);
		addHook(options.path, options.controller.prototype.beforeLeavePrevious);
	}

	// Check whether Router has beforeLeavePrevious hook
	if(typeof Router.beforeLeavePrevious === "function"){
		addHook(options.path, Router.beforeLeavePrevious);
	}
}


// We assume no routes will be added at runtime
// But we could easily add this functionality using the addHook function
Meteor.startup(function collectAllHooks () {
	Router.routes.forEach(function(route) {
		// Switch name of controller with actual controller object
		if(route.options && typeof route.options.controller === 'string') {
			route.options.controller = this[route.options.controller];
		}

		// Get existing beforeLeavePrevious hooks from controller heirarchy
		collectHooksFromRoute(route.name, route.options);
	});

	// console.log(beforeLeavePreviousHooks);
});