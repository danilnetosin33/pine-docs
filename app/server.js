const https = require("https");
const http = require("http");

//APP
const bodyParser = require("body-parser");
var express = require("express"),
  app = express(),
  port = process.env.PORT || 80;
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.listen(port);
//TRADINGECONOMICS
const te = require("tradingeconomics");
te.login("65b105e712d343e:x0blzjyj39tnysh");
//TELEGRAM
const { Telegraf, Scenes, session } = require("telegraf");
const Calendar = require("telegraf-calendar-telegram");
const { MenuTemplate, MenuMiddleware } = require("telegraf-inline-menu");
const { toHTML, toMarkdownV2 } = require("@telegraf/entity");
const bot = new Telegraf("6271843557:AAEQ6ifCSa5En8lmtWvJ3kPYU-cTPYK6XmE");
bot.use(session());

function strFromDate(date) {
  return date.toISOString().split("T")[0];
}

global["calendar_query"] = {
  importance: 1,
  initDate: strFromDate(new Date()),
  endDate: strFromDate(new Date()),
};

const botCalendar = new Calendar(bot);
let datesCount = 0;
botCalendar.setDateListener((context, date) => {
  if (datesCount == 0) {
    global["calendar_query"].initDate = date;
    context.reply("Start Date: " + date);
  }
  if (datesCount == 1) {
    global["calendar_query"].endDate = date;
    context.reply("End Date: " + date);
    context.reply("----------------------------");
    menuMiddleware.replyToContext(context);
  }
  datesCount += 1;
});
const calendarMenu = new MenuTemplate((ctx) => {
  if (!ctx.session) {
    ctx.session = {
      calendar: {
        importance: "⭐️ (Low)",
        dates: "Today",
      },
    };
  }
  return "Calendar: ";
});
//Importance
const importanceSubmenu = new MenuTemplate((ctx) => {
  if (!ctx.session) {
    ctx.session = {};
  }
  return `Importance:`;
});
importanceSubmenu.choose(
  "importance",
  ["⭐️ (Low)", "⭐️⭐️ (Medium)", "⭐️⭐️⭐️ (High)"],
  {
    columns: 1,
    maxRows: 3,
    buttonText: (ctx, text) => {
      if (text == ctx.session.calendar.importance) {
        return text + " ☑️";
      }
      return text;
    },
    do: (ctx, key) => {
      ctx.session.calendar.importance = key;
      global["calendar_query"].importance = key.length / 2;
      console.log(key.length, global["calendar_query"].importance);
      return "..";
    },
  }
);
importanceSubmenu.interact("<= Back", "back_importance", {
  do: async (ctx) => {
    return "..";
  },
});
calendarMenu.submenu(
  (ctx) => `Importance: ${ctx.session.calendar.importance} `,
  "sub1",
  importanceSubmenu
);
//Dates
const datesSubmenu = new MenuTemplate((ctx) => {
  if (!ctx.session) {
    ctx.session = {};
  }
  return `Dates:  `;
});
datesSubmenu.choose(
  "dates",
  ["Today", "Tomorrow", "Next Week", "Next Month", "Custom"],
  {
    columns: 2,
    maxRows: 3,
    do: (ctx, key, newState) => {
      ctx.session.calendar.dates = key;
      let today = new Date();
      let start_date = today;
      let end_date = null;

      if (key.toLowerCase() != "custom") {
        if (key.toLowerCase() == "today") {
          end_date = today;
        }
        if (key.toLowerCase() == "tomorrow") {
          let tomorrow = new Date(today);
          end_date = new Date(tomorrow.setDate(tomorrow.getDate() + 1));
        }
        if (key.toLowerCase() == "next week") {
          let next_week = new Date(today);
          end_date = new Date(next_week.setDate(next_week.getDate() + 7));
        }
        if (key.toLowerCase() == "next month") {
          let next_month = new Date(today);
          end_date = new Date(next_month.setMonth(next_month.getMonth() + 1));
        }
        global["calendar_query"].initDate = strFromDate(start_date);
        global["calendar_query"].endDate = strFromDate(end_date);
      } else {
        ctx.reply("Select start/end dates:", botCalendar.getCalendar());
      }

      return "..";
    },
    buttonText: (ctx, text) => {
      if (text == ctx.session.calendar.dates) {
        return text + " ☑️";
      }
      return text;
    },
  }
);
datesSubmenu.interact("<= Back", "back_dates", {
  do: async (ctx) => {
    return "..";
  },
});
calendarMenu.submenu(
  (ctx) => {
    return `Dates: (${global["calendar_query"].initDate} - ${global["calendar_query"].endDate})`;
  },
  "sub2",
  datesSubmenu
);

// Request Calendar
calendarMenu.interact("Get Calendar", "get_calendar", {
  do: async (ctx) => {
    console.log("SADASD", te);
    await te
      .getCalendar(
        (importance = global["calendar_query"].importance.toString()),
        (start_date = global["calendar_query"].initDate),
        (end_date = global["calendar_query"].endDate)
      )
      .then((data) => {
        ctx.reply(`LENGTH :: ${data.length}`);
        return data;
      })
      .then((data) => {
        data.forEach((element) => {
          let message = "";
          for (let prop in element)
            message += ` ${prop} : ${element[prop]}  \n  `;
          ctx.reply(toHTML({ text: message }));
        });
        return data;
      });
    return false;
  },
});
const menuMiddleware = new MenuMiddleware("/", calendarMenu);
bot.command("calendar", (ctx) => menuMiddleware.replyToContext(ctx));
bot.use(menuMiddleware);

// Scene
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

//Telegram API
app.post("/telegram_test", function (req, res) {
  bot.telegram.sendMessage("-1001967555467", "Hello WORLD");
  res.sendStatus(200);
});

app.post("/bars_data", function (req, res) {
  console.log("REQQQQQQ", req.body);
  // console.log("RESSSSSS", res);
  res.sendStatus(200);
});

bot.launch();

//Discord API

// MONGO DB

// const { MongoClient } = require("mongodb");

// async function connectMongoDB() {
//   const uri =
//     "mongodb+srv://danil:c8hUK7OTi5Po8YjJ@bars.gxkbypt.mongodb.net/test";
//   const client = new MongoClient(uri);
//   try {
//     await client.connect();
//     await addOneToBars(client);
//     await addOneToBars(client);
//     await addOneToBars(client);
//     await listDatabases(client);
//     console.log("CONNECTED");
//   } catch (err) {
//     console.error("ERROR DB", err);
//   } finally {
//     await client.close();
//   }
// }
// async function addOneToBars(client, data_json) {
//   let bars_db = await client.db("bars_data").collection("bars");
//   let found = bars_db.find({ _id: 1 });
//   if (!found) {
//     bars_db.insertOne(test_obj, function (err, res) {
//       if (err) {
//         console.log("ERRRRR", err);
//       }
//     });
//   }
//   let test_obj = { _id: 1, hello: "world" };

//   console.log("bars_db", bars_db);
// }
// async function listDatabases(client) {
//   databasesList = await client.db().admin().listDatabases();

//   console.log("Databases:");
//   databasesList.databases.forEach((db) => console.log(` - ${db.name}`));
// }

// connectMongoDB().catch(console.error);

// CSV work
const csv = require("csvtojson");

async function readCSV(data, file) {
  function parseToJson(json) {
    json.forEach((row) => {
      let row_obj = {};
      let keys = Object.keys(row)[0].split(",");
      let values = Object.values(row)[0].split(",");
      keys.forEach((key, index) => {
        row_obj[key] = values[index];
      });
      data.push(row_obj);
    });
  }
  let csv_obj = await csv({ delimiter: ";" }).fromFile(file);
  parseToJson(csv_obj);
}
let apple_1d = [];
readCSV(apple_1d, "./assets/AAPL/AAPL, 1H.csv");

setTimeout(() => {
  console.log("apple_1d", apple_1d);
  console.log("apple_1d_length", apple_1d.length);
}, 2000);

const alert = require("alert");
alert("Server runs !");

// const notifier = require("node-notifier");
// notifier.notify("Hello!");
