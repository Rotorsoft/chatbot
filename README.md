# _chatbot_

## A functional js chatbot

This is just a semantic layer on top of the [flow](https://www.npmjs.com/package/@rotorsoft/flow) module showing how to implement a basic chatbot engine in JavaScript.

Chatbot actions represent statements and questions asked to the end user. Answers are used as transition payloads to drive the conversation.

The bot API provides the following methods:

- **ids()**: Returns the ids (tenant, id, legid)
- **params()**: Returns the parameters
- **body()**: Returns any remaining arguments
- **state()**: Returns a copy of the current state
- **activity()**: Returns a copy of the current activity
- **version()**: Returns the current version (events length)
- **events()**: Returns array of events
- **last()**: Last event or null if empty
- **play(events = [])**: Plays _talked_ or _answered_ from events array in order. Can be used to rehydrate the bot aggregate
- **talk(mode)**: Pushes and returns current _talked_ event. Can be used to repeat questions and handle timeouts
- **answer({ version, mode, ...payload})**: Pushes _answered_ event with provided transition payload (when active and version matches last event), and then pushes next _talked_ event in flow. Returns object with pushed events (and current state when flow ends).

### Event Schemas

```javascript
talked: {
  name: "talked",
  time: new Date().toISOString(),
  activity: 'current activity name, "end" when flow is done'
  type: 'current activity type',
  mode: 'how talk event is delivered (voice, chat, sms, etc)',
  say: 'optional array of statements to say',
  ask: 'optional string with something to ask',
  sms: 'optional sms string to deliver',
  transfer: 'optional string to transfer the conversation',
  asked: 'how many times this question has been asked',
  timeout: 'timeout to control retries',
}

answered: {
  name: "answered",
  time: new Date().toISOString(),
  activity: 'current activity name',
  mode: 'how answer was received (voice, chat, sms, etc)',
  ...payload: 'object with trasition payload'
}
```

### How to use

This module exports two function closures: **_bot_** and **_reducer_**

The reducer handles transition payloads (answers to drive the chat) and action payloads to produce talked events with commands like say, ask, sms, transfer.

The bot is initialized with a map of actions, the reducer, and the following required arguments:

- **_tenant_**: Tenant id (to be used in multitenant environments)
- **_id_**: End user id
- **_legid_**: Leg id
- **_root_**: Name of root action
- **_params_**: Map with flow parameters including languageCode

The optional array of events can also be passed as argument to rehydrate the flow from persisted storage.

```javascript
const { bot, reducer } = require("@rotorsoft/chatbot");
const common = require("./actions/common");
const { main } = require("./actions/main");

const b = bot({ ...common, main }, reducer("en"), {
  tenant: "tenant123",
  id: "user1",
  legid: "chat456",
  root: "main",
  params: { name: "John", age: 20, languageCode: "en" },
});
const state = b.state();
console.log(state);
```

### Test

```bash
npm test
```

The provided tests are self explanatory and should log a trace like this:

```javascript
[ 0] main() { // [{"say":{"en":"Hi.","...}, authenticate(state,scope,{params}), begin({authenticate={}}), end()]
[ 0]    {"say":{"en":"Hi.","es":"Hola."}}
[ 'Hi.' ]
[ 3]    authenticate() { // [{"ask":{"en":"Am I s...}, (state,{recur})]
[ 3]       {"ask":{"en":"Am I speaking with John?","es":"Estoy hablando con John?"}}
[ 'Hi.' ] Am I speaking with John?
[ 3]       (state,{recur}) ... [ 4]       canComeToThePhone() { // [{"ask":{"en":"Ok, ca...}, (state,{recur})]
[ 4]          {"ask":{"en":"Ok, can John come to the phone?","es":"John puede venir al telefono?"}}
[] Ok, can John come to the phone?
[ 4]          (state,{recur}) ... [ 5]          canComeToThePhone:1() { // [{"ask":{"en":"Ok, ca...}, (state,{recur})]
[ 5]             {"ask":{"en":"Ok, can John come to the phone?","es":"John puede venir al telefono?"}}
[ "I didn't get that. Can you repeat?" ] Ok, can John come to the phone?
[ 5]             (state,{recur}) ... [ 6]             verifyPhone() { // [{"ask":{"en":"Is thi...}, (state,{recur})]
[ 6]                {"ask":{"en":"Is this the correct number for John?","es":"Es este el numero correcto para hablar con John?"}}
[] Is this the correct number for John?
[ 6]                (state,{recur}) ... [ 6]                {"say":{"en":"Ok, thank you. Could you please tell John that this is a test? We’ll try calling back at a later time.","es":"Ok, gracias. Le prodria decir a John que this is a test? Llamaremos en otra ...}
[
  'Ok, thank you. Could you please tell John that this is a test? We’ll try calling back at a later time.'
]
[ 6]             } // verifyPhone
[ 5]          } // canComeToThePhone:1
[ 4]       } // canComeToThePhone
[ 3]    } // authenticate
[ 2]    begin() {
[ 2]    } // begin
[ 1]    end() {
[ 1]       {"say":{"en":"Good bye.","es":"Adios."}}
[
  'Ok, thank you. Could you please tell John that this is a test? We’ll try calling back at a later time.',
  'Good bye.'
]
[ 1]    } // end
[ 0] } // main
{
  main: {},
  authenticate: { mode: undefined, text: undefined, value: undefined, intent: 'no' },
  canComeToThePhone: { mode: undefined, text: undefined, value: undefined, intent: 'no' },
  verifyPhone: { mode: undefined, text: undefined, value: undefined, intent: 'yes' },
  say: [
    'Ok, thank you. Could you please tell John that this is a test? We’ll try calling back at a later time.',
    'Good bye.'
  ],
  end: {}
}
    √ should verify phone when user cannot come to the phone (63ms)
```

---

<div align="right">
 <i>Simplicity is the ultimate sophistication</i>

<small><i>Leonardo da Vinci</i></small>

</div>

---

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.

## License

[MIT](https://choosealicense.com/licenses/mit/)
