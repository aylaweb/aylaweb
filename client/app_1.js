Meteor.startup(function ()
{
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
        e.detail._id = e.detail.app + "$" + e.detail.id;
        if (ElemRep.find({_id: e.detail._id}).fetch().length === 0) {
            ElemRep.insert(e.detail);
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
            var elemId = e.srcElement.app + "$" + e.srcElement.id + "$" + owner;
            if (ElemRep.find({_id: elemId}).fetch().length === 0) {
                var detail = {};
                detail.owner = owner;
                detail.app = e.srcElement.app;
                detail.id = e.srcElement.id;
                detail._id = elemId;
                detail.idElem = e.srcElement.app + "$" + e.srcElement.id;
                ElemRep.upsert(detail);
            }
            var obj = {};
            var property = Object.keys(e.detail)[0];
            obj[property] = e.detail[property];
            obj['changed_at'] = new Date().getTime();
            ElemRep.update(
                    {_id: elemId},
            {$set: obj})
        }
    });
    window.addEventListener("loadapp", function (e) {
        var urlObject = new URL(e.detail.url);
        var appName = urlObject.pathname.split('/').pop().split('.').reverse().pop();
        // If the app has not been loaded before
        if (!(sessionStorage.getItem(appName + '$' + appName + '$' + 'subscribed'))) {
            Meteor.subscribe('appPub', appName, function () {
                sessionStorage.setItem(appName + '$' + appName + '$' + 'subscribed', true);
                var appElemRepsCursor = ElemRep.find({app: appName});
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
                if (e.detail.url && !(e.detail.url.indexOf('forcedbyurl') >= 0)) {
                    var loader = document.querySelector('vip-loader');
                    // There are not elements about this app in the DB. The app is loaded for first time in the system
                    if (appElemRepsCursor.fetch().length === 0) {
                        if (!urlObject.search)
                            urlObject.search = "?forcedbyurl";
                        else
                            urlObject.search.concat = "&forcedbyurl";
                        loader.url = urlObject.toString();
                    }
                    // There are not elements about this app in the DB. The app has been loaded before in the system
                    else {
                        var appConfig = {};
                        appElemRepsCursor.fetch().forEach(function (elem) {
                            if (elem.owner && elem.owner === Meteor.userId()) {
                                var createElem = function (id) {
                                    var elemIni = ElemRep.findOne({_id: id});
                                    _.extend(elemIni, elem);
                                    return (elemIni);
                                }
                                appConfig[elem.id] = createElem(elem.idElem);
                            }
                            else if (!elem.owner && !appConfig[elem.id]) {
                                appConfig[elem.id] = elem;
                            }
                        });

                        loader.loadConfig(appConfig);
                    }
                }

            });

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

});