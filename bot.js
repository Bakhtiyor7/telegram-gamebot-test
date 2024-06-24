process.env.NTBA_FIX_319 = 1;
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const Agent = require('socks5-https-client/lib/Agent');
const mongoose = require("mongoose");

const TOKEN = "7263610501:AAHZLOzAd3_DfFb-GFmvI0K3IGVwyNYoVl0";
const bot_username = "churr_referral_bot";
const bot = new TelegramBot(TOKEN, {polling:true,request:{
    agentClass: Agent,
    agentOptions: {
      socksHost: '169.254',
      socksPort: '16'
    }
  }});


bot.on("polling_error", (msg) => console.log(msg));
mongoose.connect('mongodb://localhost:27017/telegram-bot',
  // useNewUrlParser: true,
  // useUnifiedTopology: true
).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Failed to connect to MongoDB', err);
});


const userSchema = new mongoose.Schema({
  userId: Number,
  referredBy: Number,
  referrals: [Number],
});

const User = mongoose.model("User", userSchema);

bot.onText(/\/start (.+)/, async (msg, match) => {
  const userId = msg.from.id;
  const referrerId = match[1];

  let user = await User.findOne({ userId });

  if (!user) {
    user = new User({ userId, referredBy: referrerId, referrals: [] });

    let referrer = await User.findOne({ userId: referrerId });
    if (referrer) {
      referrer.referrals.push(userId);
      await referrer.save();
      bot.sendMessage(
        userId,
        `Thanks for joining via referral! You were referred by ${referrerId}.`
      );
    } else {
      bot.sendMessage(userId, "Welcome!");
    }

    await user.save();
    bot.sendMessage(
      userId,
      `Your referral link: https://t.me/${bot_username}?start=${userId}`
    );
  }
});

bot.onText(/\/start/, async (msg) => {
  const userId = msg.from.id;

  let user = await User.findOne({ userId });

  if (!user) {
    user = new User({ userId, referredBy: null, referrals: [] });
    await user.save();
    bot.sendMessage(userId, "Welcome!");
    bot.sendMessage(
      userId,
      `Your referral link: https://t.me/${bot_username}?start=${userId}`
    );
  }
});

const app = express();

app.get("/", (req, res) => {
  res.send("Bot is running...");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

console.log("Bot is running...");
