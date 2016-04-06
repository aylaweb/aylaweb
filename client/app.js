Meteor.startup(function ()
{
    _ = lodash;
    Ayla = window.Ayla || {};
    Ayla.ElemRep = new Mongo.Collection("elemrep");
    Ayla.Messages = new Mongo.Collection("messages");
    Ayla.Videos = new Mongo.Collection("videos");
    Meteor.subscribe('appElems', {});
    Meteor.subscribe('messages', {});
    window.addEventListener("loginwithpassword", function (e) {
        var username = e.detail.username;
        var password = e.detail.password;
        Meteor.loginWithPassword(username, password, function (error) {
            e.detail.callback(error);
        });
    });

    window.addEventListener("logout", function (e) {
        Meteor.logout(function (error) {
            e.detail.callback(error);
        });
    });

    window.addEventListener("createuser", function (e) {
        var user;
        user = {
            email: e.detail.username,
            password: e.detail.password
        };
        Accounts.createUser(user, function (error) {
            e.detail.callback(error);
        });
    });

    window.addEventListener("elemconfig", function (e) {
        e.detail._id = e.detail.appId + "$" + e.detail.id;
        if (Meteor.userId())
        {
            e.detail._id = e.detail._id + "$" + Meteor.userId();
            e.detail.owner = Meteor.userId();
        }
        if (Ayla.ElemRep.find({_id: e.detail._id}).fetch().length === 0) {
            Ayla.ElemRep.insert(e.detail);
        }
        /*   if (Meteor.userId()) {
         if (ElemRep.find({_id: e.detail._id, owner: Meteor.userId()}).fetch().length === 0) {
         var detail = {};
         var owner = Meteor.userId();
         detail.owner = owner;
         detail._id = e.detail._id + "$" + owner;
         detail.elemId = e.detail_id;
         ElemRep.insert(detail);
         }
         } */
    });
    window.addEventListener("changeinfo", function (e) {
        var owner = Meteor.userId();
        if (owner) {
            var elemId = e.srcElement.appId + "$" + e.srcElement.id + "$" + owner;
            if (Ayla.ElemRep.find({_id: elemId}).fetch().length === 0) {
                var detail = {};
                detail.owner = owner;
                detail.appId = e.srcElement.appId;
                detail.id = e.srcElement.id;
                detail._id = elemId;
                detail.idElem = e.srcElement.appId + "$" + e.srcElement.id;
                Ayla.ElemRep.insert(detail);
            }
            var obj = {};
            var property = Object.keys(e.detail)[0];
            obj[property] = e.detail[property];
            obj['changed_at'] = new Date().getTime();
            Ayla.ElemRep.update(
                    {_id: elemId},
            {$set: obj})
        }
    });

    window.addEventListener("loadmessages", function (e) {
        var appId = e.detail.elem.appId;
        var synched = e.detail.elem.id;
        Meteor.subscribe('messages', [appId, synched], function () {
            console.log("subscription done");
        });
    });

    window.addEventListener("loadapp", function (e) {
        if (e.detail.loadServer) {
            var urlObject = new URL(e.detail.url);
            var appName = urlObject.pathname.split('/').pop().split('.').reverse().pop();
            // If the app has not been loaded before
            if (!(sessionStorage.getItem(appName + '$' + appName + '$' + 'subscribed'))) {
                Meteor.subscribe('appPub', appName, function () {
                    sessionStorage.setItem(appName + '$' + appName + '$' + 'subscribed', true);
                    var appElemRepsCursor = Ayla.ElemRep.find({appId: appName});
                    appElemRepsCursor.observeChanges({
                        changed: function (id, fields) {
                            if (Object.keys(fields).length < 2) {
                                var elemName = id.split('$').pop();
                                var elem = document.querySelector('#' + elemName);
                                if (elem) {
                                    for (var field in fields) {
                                        elem[field] = fields[field];
                                    }
                                }
                            }
                        }
                    });
                    if (e.detail.loadServer) {
                        // There are not elements about this app in the DB. The app is loaded for first time in the system
                        if (appElemRepsCursor.fetch().length === 0) {
                            var event = new CustomEvent('loadapp', {'detail': {url: e.detail.url, doLoad: true, loadServer: true}});
                            document.dispatchEvent(event);
                        }
                        // There are elements about this app in the DB. The app has been loaded before in the system
                        else {
                            var appConfig = {};
                            appElemRepsCursor.fetch().forEach(function (elem) {
                                if (elem.owner && elem.owner === Meteor.userId()) {
                                    var createElem = function (id) {
                                        var elemIni = Ayla.ElemRep.findOne({_id: id});
                                        _.extend(elemIni, elem);
                                        return (elemIni);
                                    }
                                    appConfig[elem.id] = createElem(elem.idElem);
                                }
                                else if (!elem.owner && !appConfig[elem.id]) {
                                    appConfig[elem.id] = elem;
                                }
                            });
                            var event = new CustomEvent('loadapp', {'detail': {json: appConfig, doLoad: true, loadServer: true}});
                            document.dispatchEvent(event);
                        }
                    }

                });

            }
        }
    });
    Router.route('/', function () {
        this.render('Home');
    });
    Router.route('/local', function () {
        this.render('Local');
    });
    Router.route('/copyright', function () {
        this.render('Copyright');
    });
    Router.route('/dev', function () {
        this.render('Dev');
    });
    Router.route('/server', function () {
        this.render('Server');
    });
    Router.route('/main', function () {
        this.render('Main');
    });

});