
Meteor.startup(function () {
    
    Meteor.publish('apps', function () {
        return Ayla.ElemRep.find({etype: "vip-app"}, {$or: [{owner: this.userId}, {owner: {$exists: false}}]});
    });
    
    Meteor.publish('appElements', function (selector) {
        return Ayla.ElemRep.find(selector);
    });
    
    /* Meteor.publish('appElements', function (appId) {
        return ElemRep.find({appId: appId}, {$or: [{owner: this.userId}, {owner: {$exists: false}}]});
    }); */
    
    
    Meteor.publish('appOwns', function () {
        return Ayla.ElemRep.find({etype: "vip-app", owner: this.userId});
    });
    Meteor.publish('messages', function (selector) {
        return Ayla.Messages.find(selector);
    });
    Meteor.publish('appElems', function (selector) {
        return Ayla.ElemRep.find(selector);
    });
    
    Meteor.publish('videos', function () {
        return Ayla.Videos.find();
    });
});
		      