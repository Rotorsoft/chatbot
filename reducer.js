const repeat = {
  en: [
    "I didn't get that. Can you repeat?",
    "I did not understand your answer.",
    "I didn't get that.",
    "Sorry, I didn't understand.",
    "I am sorry, can you repeat?",
    "I cannot understand what you just said.",
  ],
  es: [
    "No entendí, me puede repetir?",
    "No entendí su respuesta.",
    "Lo siento, no pude entender.",
    "Lo siento, puede repetir?",
    "No pude entender lo que dijo.",
  ],
};

const hint = {
  en: {
    boolean: "Say yes or press 1. Say no or press 2.",
  },
  es: {
    boolean: "Diga si o marque 1. Diga no o marque 2.",
  },
};

const hint_modes = ["voice", "dtmf"];
const commands = ["say", "ask", "sms", "transfer"];

module.exports = (lang, onaction = null) => (
  state,
  { name = "$root", recur },
  {
    time,
    activity,
    mode,
    text,
    value,
    intent,
    say,
    ask,
    sms,
    transfer,
    type = "boolean",
    ...rest
  }
) => {
  // transition payloads are marked by activity and time
  if (time && activity) {
    commands.map((kw) => delete state[kw]);
    state[activity] = Object.assign(state[activity] || {}, {
      mode,
      text,
      value,
      intent,
    });
    return state;
  }

  // action payloads can have commands like say, ask, sms, transfer
  if (sms) state.sms = sms[lang];
  if (transfer) state.transfer = transfer;
  if (say) {
    state.say = state.say || [];
    state.say.push(say[lang]);
    delete state.ask;
  }
  if (ask && !state.transfer) {
    // give a little context when repeating a question
    if (recur && !say) {
      const r = repeat[lang];
      if (r) state.say = [r[Math.floor(Math.random() * r.length)]];
      if (hint_modes.includes(mode)) {
        const h = hint[lang][type];
        if (h) state.say.push(h);
      }
    }
    state.ask = ask[lang];
  }
  // copy rest to state
  state[name] = Object.assign(state[name] || {}, { type, ...rest });
  if (onaction) onaction(state);
  return state;
};
