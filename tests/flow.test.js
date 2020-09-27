"use strict";

const { describe, it } = require("mocha");
const chai = require("chai");
chai.should();

const { bot, reducer } = require("../index");
const common = require("./actions/common");
const { main } = require("./actions/main");

const { invoked, shifted } = require("@rotorsoft/flow/logger");

const play = async (params, events) => {
  const actions = { ...common, main };
  const tenant = "test";
  const id = Date.now().toString();
  const legid = Date.now().toString();
  params.languageCode = "en";

  const b = bot(
    actions,
    reducer(params.languageCode, ({ say = [], ask = "" }) => {
      console.log(say, ask);
    }),
    {
      tenant,
      id,
      legid,
      root: "main",
      params,
      events: events.map((e) => {
        const activity = Object.keys(e)[0];
        return { name: "answered", time: Date.now(), activity, ...e[activity] };
      }),
    },
    {
      invoked,
      shifted,
    }
  );
  const state = b.state();
  console.log(state);
  return state;
};

describe("common", () => {
  it("should authenticate", async () => {
    const events = [{ authenticate: { intent: "yes" } }];
    const $ = await play({ name: "John", message: "this is a test" }, events);
    $.authenticate.intent.should.equal("yes");
  });

  it("should repeat", async () => {
    const events = [
      { authenticate: { intent: "unknown", mode: "voice" } },
      { authenticate: { intent: "timeout" } },
      { authenticate: { intent: "yes" } },
    ];
    const $ = await play({ name: "John", message: "this is a test" }, events);
    $.authenticate.intent.should.equal("yes");
  });

  it("should verify phone when user cannot come to the phone", async () => {
    const events = [
      { authenticate: { intent: "no" } },
      { canComeToThePhone: { intent: "what?" } },
      { canComeToThePhone: { intent: "no" } },
      { verifyPhone: { intent: "yes" } },
    ];
    const $ = await play({ name: "John", message: "this is a test" }, events);
    $.verifyPhone.intent.should.equal("yes");
  });

  it("should respond to voicemail", async () => {
    const events = [{ authenticate: { intent: "voicemail" } }];
    const $ = await play({ name: "John", message: "this is a test" }, events);
    $.authenticate.intent.should.equal("voicemail");
  });
});
