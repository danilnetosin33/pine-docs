const https = require("https");
const http = require("http");

//APP
var express = require("express"),
  app = express(),
  port = process.env.PORT || 80;
app.use(express.json());
app.listen(port);
//TRADINGECONOMICS
const te = require("tradingeconomics");
te.login("65b105e712d343e:x0blzjyj39tnysh");
//TELEGRAM
const { Telegraf, Scenes, session } = require("telegraf");
const Calendar = require("telegraf-calendar-telegram");
const { toHTML, toMarkdownV2 } = require("@telegraf/entity");
const bot = new Telegraf("6271843557:AAEQ6ifCSa5En8lmtWvJ3kPYU-cTPYK6XmE");

const botCalendar = new Calendar(bot);

botCalendar.setDateListener((context, date) => context.reply(date));
// retreive the calendar HTML
bot.command("calendar1", (context) =>
  context.reply("Here you are", botCalendar.getCalendar())
);

const sceneCalendar = new Scenes.BaseScene("calendar");
sceneCalendar.enter((ctx) => {
  global["Calendar"] = {
    step: 0,
    filter: false,
    settings: {},
  };
  ctx.reply("Get ALL ?");
});
sceneCalendar.on("text", (ctx) => {
  let text = ctx.message.text;

  if (global["Calendar"].step == 0) {
    if (text.toLowerCase() == "true") {
      ctx.scene.leave();
    } else {
      ctx.reply("Dates ?");
    }
  }
  if (global["Calendar"].step == 1) {
    ctx.reply("Country ?");
    global["Calendar"].settings.dates = text;
  }
  if (global["Calendar"].step == 2) {
    ctx.reply("Importance ?");
    global["Calendar"].settings.country = text;
  }
  if (global["Calendar"].step == 3) {
    global["Calendar"].settings.importance = text;
    ctx.scene.leave();
  }
  global["Calendar"].step += 1;
});

sceneCalendar.leave((ctx) => {
  ctx.reply(JSON.stringify(global.Calendar));
});

const stage = new Scenes.Stage([sceneCalendar]);
bot.use(session());
bot.use(stage.middleware());
// Local API
app.get("/", function (req, res) {
  console.log("RES", res);
  res.send("Homepage here");
});
app.post("/", function (req, res) {
  console.log("GGGGG", res);
  console.log("FFFFF", req.body);
  if (req.body) {
    fetch(
      "https://discord.com/api/webhooks/1092784716622602301/E9NeI1e3mtSZuhNHas5zezY3BPD3rM9ixWad3hV-7ciV0CfgUg80xtgjLWjfOnIwcW2-",
      {
        method: "POST",
        body: req.body,
      }
    );
  }

  res.sendStatus(200);
});

//TE calendar API
app.get("/calendar", function (req, res) {
  data = te.getCalendar().then(function (data) {
    console.log("CALEDNAR_DATA", data);
    ctx.reply(JSON.stringify(data));
  });
});
bot.command("calendar", (ctx) => {
  data = te
    .getCalendar()
    .then((data) => {
      ctx.reply(`LENGTH :: ${data.length}`);
      return data;
    })
    .then(function (data) {
      console.log("CALEDNAR_DATA", data);

      data.forEach((element) => {
        let message = "";
        for (let prop in element)
          message += ` ${prop} : ${element[prop]}  \n  `;
        ctx.reply(toHTML({ text: message }));
      });
    });
});

bot.command("test", (ctx) => {
  ctx.scene.enter("calendar");
});

// bot.command("calendar_dates", (ctx) => {
//   ctx.scene.enter("importance");
//   console.log(global.CalendarFilter);

//   bot.on("text", (ctx) => {
//     console.log(global.CalendarFilter);
//     console.log("TEXTTTTTT");
//     if (CalendarFilter.isClosed) {
//       CalendarFilter.isClosed = false;
//       ctx.reply(JSON.stringify(CalendarFilter));
//     }
//   });
// });

//Telegram API
app.post("/telegram_test", function (req, res) {
  bot.telegram.getChat("-1001967555467").then((res) => {
    console.log("RESPONSE", res);
  });
  bot.telegram.sendMessage("-1001967555467", "Hello WORLD");
  res.sendStatus(200);
});

bot.start((ctx) => {
  // pine-script channel ID = -1001967555467
  ctx.telegram.sendMessage("-1001967555467", "Hello");
});

bot.catch((err, ctx) => {
  console.log(`Error:: ${ctx.updateType}`, err);
});
bot.launch();

//Discord API
