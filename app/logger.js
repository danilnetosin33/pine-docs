// channel id (pinescript_test) :-1001967555467
// bot token : 6271843557:AAEQ6ifCSa5En8lmtWvJ3kPYU-cTPYK6XmE

const alert = require("alert");
const { Telegraf } = require("telegraf");

module.exports.Logger = function (type, message, channel_id) {
  if (type == "alert") {
    alert(message);
  }
  if (type == "telegram") {
    let CHANNEL_ID = channel_id ? channel_id : "-1001967555467";
    let BOT_TOKEN = "6271843557:AAEQ6ifCSa5En8lmtWvJ3kPYU-cTPYK6XmE";
    const bot = new Telegraf(BOT_TOKEN);
    bot.telegram.sendMessage(CHANNEL_ID, message);
  }
};
