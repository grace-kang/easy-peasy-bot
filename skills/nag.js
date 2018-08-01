//sends out a daily nag to specific users

module.exports = function(controller) {
  var bot = controller.spawn({
    incoming_webhook: {
      url: process.env.WEBHOOK_URL
    }
  });

  /* Grab all the IM ids, user ids, and emails of all the users in the team
   * NOTE: assumes that a DM is automatically generated for each user
   */
  var schedule = require('node-schedule');
  const axios = require('axios');

  //this rule will execute the job every weekday at 9:00 AM
  var rule = new schedule.RecurrenceRule();
  rule.dayOfWeek = new schedule.Range(1, 5);
  // rule.hour = 9;
  // rule.minute = 0;
  rule.second = 0;

  var dms = [];

  /*
   * Makes a GET request to REQUEST_URL with today's date
   * Gets a list of emails to direct message on Slack
   * Sends the attach variable to all the users
   */
  function nagUsers(dms) {
    var today = new Date(Date.now());
    var inputDate = today.toISOString().split('T')[0];

    /*
     * message sent to users who have not filled out form 
     */
    var attach = [
    {
      "color": "#F7DC6F",
      "pretext": ":warning: You have not yet submitted an entry this week. :warning: \nYou will be reminded every day until you submit the form.",
      "author_name": "NagBot inc.",
      "title": "Important Form",
      "title_link": process.env.WEB_URL,
      "text": "This is a form you were supposed to submit.",
      "ts": today.getTime()/1000
    }
    ];

    axios.get(process.env.REQUEST_URL + '?date=' + inputDate)
      .then(function(response) { 
        var res= response.data.displayEditors;
        var editors = [];
        for (i in res) {
          editors.push(res[i][0]);
        }
        for (i in dms) {
          if (dms[i].remind && editors.includes(dms[i].email)) {
            var id = dms[i].id;
            bot.api.chat.postMessage({ token: process.env.BOT_TOKEN, channel: id, attachments: attach}, function(err, res){
              if (err) {
                console.log(err)
              }
            });
          }
        }
      })
    .catch(error => {
      console.log(error)
    });
  }

  //get an initial list of direct messages
  dms = [];
  bot.api.im.list({ token: process.env.BOT_TOKEN }, function(err, response) {
    if (err) {
      console.log(err)
    }
    for (var i in response.ims) {
      var id = response.ims[i].id
        var user = response.ims[i].user
        dms.push({ id: id, user: user })
    }
    bot.api.users.list({ token: process.env.BOT_TOKEN }, function(err, user_response) {
      if (err) {
        console.log(err)
      }
      for (i in user_response.members) {
        user = user_response.members[i].id;
        var is_bot = user_response.members[i].is_bot;
        for (j in dms) {
          if (dms[j].user == user) {
            if (!is_bot && user != 'USLACKBOT') {
              dms[j].email = user_response.members[i].profile.email
                dms[j].remind = true
            } else {
              dms.splice(j, 1)
            }
          }
        }
      }
    })
  })


  /*
   * Get direct message (dms) array
   * and execute nagUsers()
   * at a recurring date & time
   */

  var job = schedule.scheduleJob(rule, function() {
    nagUsers(dms);
  });

  /*
   * When 'progress' is heard, will reply current progress of the user
   */
  controller.hears('^progress', 'direct_message,direct_mention', function(bot, message) {
    var user = message.user;
    for (i in dms) {
      if (user == dms[i].user) {
        var user_email = dms[i].email;
      }
    }
    axios.get(process.env.REQUEST_URL + '?email=' + user_email)
      .then(function(response) {
        var weeks = response.data.weeks
          var entries = response.data.entries
          var reply = "Here's your current progress: \n";
        for (var i = 0; i < weeks.length; i++) {
          if (weeks[i].length > 0) {
            var date = new Date(weeks[i]).toDateString().split(' ')
              weeks[i] = '    ' + date[1] + ' ' + date[2] + '-' + (new Date(weeks[i]).getDate()+7) + ' ';
            reply += weeks[i];
            if (entries[i] && entries[i+1]) {
              reply += ' :heavy_check_mark:\n';
            } else {
              reply += ' :x:\n';
            }
          }
        }
        bot.reply(message, reply);
      })
    .catch(error => {
      console.log(error);
    });
  });

  function get_index(user) {
    for (i in dms) {
      if (user == dms[i].user) {
        return i;
      }
    }
    return null;
  }

  /* 
   * When 'toggle' is heard, will toggle on/off the reminders for the user
   */
  controller.hears('^toggle', 'direct_message,direct_mention', function(bot, message) {
    var i = get_index(message.user);
    if (dms[i].remind) {
    bot.createConversation(message, function(err, convo) {
      convo.addMessage({
        text: 'Alright! You will no longer receive reminders from me.',
      }, 'yes');

      convo.addMessage({
        text: 'Okay.',
      }, 'no');

      convo.addMessage({
        text: 'Sorry, I did not understand.',
        action: 'default',
      }, 'bad_response');

      convo.addQuestion('Are you sure you want me to turn off your reminders?', [
          {
            pattern: bot.utterances.yes,
            callback: function(response, convo) {
              var index = get_index(convo.sent[0].to);
              dms[index].remind = false;
              convo.gotoThread('yes');
            },
          },
          {
            pattern: bot.utterances.no,
            callback: function(response, convo) {
              convo.gotoThread('no');
            },
          },
          { 
            default: true,
            callback: function(response, convo) {
            convo.gotoThread('bad_response');
                     },
          }
      ], {}, 'default');

      convo.activate();
    });
    } else {
      dms[i].remind = true;
      bot.reply(message, 'Sounds great! You will now receive reminders from me.');
    }
  });
}


