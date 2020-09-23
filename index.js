const flow = require("@rotorsoft/flow");
const reducer = require("./reducer");

const E = {
  TALKED: "talked",
  ANSWERED: "answered",
};

const DEFAULTS = {
  MODE: "voice",
  TYPE: "boolean",
};

const bot = (
  actions,
  reducer,
  { tenant, id, legid, root, params, events = [] } = {},
  { invoked, shifted } = {}
) => {
  if (!tenant) throw Error("Missing tenant");
  if (!id) throw Error("Missing id");
  if (!legid) throw Error("Missing legid");
  if (!root) throw Error("Missing root action");
  if (!params) throw Error("Missing parameters");
  if (!actions) throw Error("Missing actions");
  if (!actions[root]) throw Error(`Action ${root} not found in actions`);

  const next = flow({ actions, params, reducer, invoked, shifted });
  let $ = next(actions[root]);

  const state = () => ({ ...$.state });

  const activity = () => {
    const current = $.state[$.scope.name] || {};
    current.type = current.type || DEFAULTS.TYPE;
    return current;
  };

  const play = (events = []) => {
    for (const e of events) {
      if (e.name === E.TALKED) _events.push(e);
      else if (e.name === E.ANSWERED) {
        _events.push(e);
        $ = next(e);
      }
    }
  };

  const talk = async (mode = DEFAULTS.MODE, answered = null) => {
    const { name = "end", recur = 0 } = $.scope;
    const { say = [], ask = "", sms, transfer, timeout = 10000 } = $.state;
    const { type = DEFAULTS.TYPE } = $.state[name] || {};
    const time = new Date().toISOString();
    const ending = $.done;
    const asked = recur + 1;
    const state = ending ? { ...$.state } : null;
    const talked = {
      name: E.TALKED,
      time,
      activity: name,
      type,
      mode,
      say,
      ask,
      sms,
      transfer,
      asked,
      ending,
      timeout,
    };
    if (answered) answered.version = _events.push(answered);
    talked.version = _events.push(talked);
    return { answered, talked, state };
  };

  const answer = async ({ version, mode, ...payload } = {}) => {
    let answered = null;
    if (!$.done && version == _events.length) {
      answered = {
        name: E.ANSWERED,
        time: new Date().toISOString(),
        activity: $.scope.name,
        mode,
        ...payload,
      };
      $ = next(answered);
    }
    return await talk(mode, answered);
  };

  const _events = [];
  play(events);

  return { state, activity, play, talk, answer };
};

module.exports = { bot, reducer };
