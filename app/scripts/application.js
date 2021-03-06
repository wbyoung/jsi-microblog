'use strict';

var JsiMicroblog = Ember.Application.create();
// expose JsiMicroblog globally
window.JsiMicroblog = JsiMicroblog;
var App = window.App = JsiMicroblog;

App.AdmitOneContainers = {}; // overridable by tests
Ember.AdmitOne.setup({ containers: App.AdmitOneContainers });

JsiMicroblog.Router.reopen({
  location: 'history'
});

JsiMicroblog.ApplicationAdapter = DS.RESTAdapter.extend({
  namespace: 'api'
});


App.Router.map(function() {
  this.route('signup');
  this.route('login');
  this.route('logout');
  this.route('profile');
});

App.ProfileRoute = Ember.Route.extend(Ember.AdmitOne.AuthenticatedRouteMixin, {
});

App.User = DS.Model.extend({
  username: DS.attr('string'),
  password: DS.attr('string')
});

App.LoginRoute = Ember.Route.extend({
  beforeModel: function() {
    this._super();
    if (this.get('session').get('isAuthenticated')) {
      this.transitionTo('profile');
    }
  }
});

App.LoginController = Ember.Controller.extend({
  actions: {
    authenticate: function() {
      var self = this;
      var session = this.get('session');
      var credentials = this.getProperties('username', 'password');
      this.set('error', undefined);
      this.set('password', undefined);
      session.authenticate(credentials).then(function() {
        var attemptedTransition = self.get('attemptedTransition');
        if (attemptedTransition) {
          attemptedTransition.retry();
          self.set('attemptedTransition', null);
        } else {
          self.transitionToRoute('profile');
        }
      })
      .catch(function(error) {
        self.set('error', error);
      });
    }
  }
});

App.LogoutRoute = Ember.Route.extend({
  beforeModel: function() {
    this._super();
    var self = this;
    var session = this.get('session');
    return session.invalidate().finally(function() {
      self.transitionTo('index');
    });
  }
});

App.SignupRoute = Ember.Route.extend({
  model: function() {
    return this.store.createRecord('user');
  }
});

App.SignupController = Ember.ObjectController.extend({
  actions: {
    signup: function() {
      var session = this.get('session');
      var self = this;

      this.set('error', undefined);
      this.get('model').save() // create the user
      .then(function() {
        session.login({ username: self.get('model.username') });
        self.transitionToRoute('profile');
      })
      .catch(function(error) {
        if (error.responseJSON) { error = error.responseJSON; }
        if (error.error) { error = error.error; }
        self.set('error', error);
      });
    }
  }
});

// TODO: Define some actions for creating new microblog posts.

App.Post = DS.Model.extend({
  post: DS.attr('string')
});

App.ProfileController = Ember.Controller.extend({
  actions: {
    createPost: function() {
      var post = this.store.createRecord('post', {
        post: this.get('postBody')
      });
      post.save().then(function() {
        console.log(post.get('post'));
        // what to do when the post was successfully saved
      })
      .catch(function() {
        console.log('post was not created');
        // what to do when saving the post failed.
      });
    }
  }
});
