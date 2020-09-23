function canComeToThePhone(state, scope, { params }) {
  return [
    {
      ask: {
        en: `Ok, can ${params.name} come to the phone?`,
        es: `${params.name} puede venir al telefono?`,
      },
    },
    (state, { recur }) => {
      if (state.canComeToThePhone.intent === "yes") return gotToThePhone;
      if (state.canComeToThePhone.intent === "no") return verifyPhone;
      if (recur < 2) return canComeToThePhone;
      return verifyPhone;
    },
  ];
}

function gotToThePhone(state, scope, { params }) {
  return [
    {
      say: {
        en: `Please press any key when ${params.name} gets to the phone.`,
        es: `Por favor presione una tecla cuando ${params.name} este al telefono.`,
      },
    },
    (state, { recur }) => {
      if (state.gotToThePhone.intent !== "timeout") return authenticate;
      if (recur < 10) return gotToThePhone;
    },
  ];
}

function authenticate(state, scope, { params }) {
  return [
    {
      ask: {
        en: `Am I speaking with ${params.name}?`,
        es: `Estoy hablando con ${params.name}?`,
      },
    },
    (state, { recur }) => {
      const intent = (state.authenticate || {}).intent;
      if (intent === "yes") return;
      if (intent === "no") return canComeToThePhone;
      if (intent === "voicemail" || recur > 1)
        return {
          say: {
            en: `Hi ${params.name}, ${params.message}. I will be calling you back soon.`,
            es: `Hola ${params.name}, ${params.message}. Pronto llamaremos de vuelta.`,
          },
        };
      return authenticate;
    },
  ];
}

function verifyPhone(state, scope, { params }) {
  return [
    {
      ask: {
        en: `Is this the correct number for ${params.name}?`,
        es: `Es este el numero correcto para hablar con ${params.name}?`,
      },
    },
    (state, { recur }) => {
      if (state.verifyPhone.intent === "yes")
        return {
          say: {
            en: `Ok, thank you. Could you please tell ${params.name} that ${params.message}? We’ll try calling back at a later time.`,
            es: `Ok, gracias. Le prodria decir a ${params.name} que ${params.message}? Llamaremos en otra ocasion.`,
          },
        };
      if (state.verifyPhone.intent === "no")
        return {
          say: {
            en:
              "We’re sorry for the inconvenience. Thanks for letting us know and have a great day!",
            es: "Lo sentimos. Gracias por todo y tenga un buen dia!",
          },
        };
      if (recur < 2) return verifyPhone;
    },
  ];
}

function getPhone() {
  return [
    {
      type: "string",
      ask: {
        en: "Please say or enter your phone number now followed by a #.",
        es:
          "Por favor diga o marque su numero telefonico seguido por el simbolo de numero.",
      },
    },
    (state, { recur }) => {
      if (state.getPhone.intent === "string")
        return {
          say: {
            en: "Thank you",
            es: "Gracias",
          },
        };
      if (recur < 3) return getPhone;
    },
  ];
}

const $confirm = (state, name) => {
  const { confirming = {} } = state;
  confirming.retry = confirming.name === name ? (confirming.retry || 0) + 1 : 1;
  confirming.name = name;

  return [
    { confirming },
    function confirm(state) {
      const { type = "boolean", intent, value, text } = state[
        state.confirming.name
      ];

      let say;
      switch (type) {
        case "boolean":
          say = {
            en: `I got a ${intent}`,
            es: `Entendimos ${intent}`,
          };
          break;

        case "date":
          try {
            const mdy = new Date(value).toLocaleDateString();
            say = {
              en: `I got ${mdy}`,
              es: `Entedimos ${mdy}`,
            };
          } catch (error) {
            say = {
              en: "I got an invalid date.",
              es: "La fecha no es valida.",
            };
          }
          break;

        default:
          say = {
            en: `I got "${text}"`,
            es: `Entendimos "${text}"`,
          };
      }
      return [
        {
          say,
          ask: {
            en: "Is this correct?",
            es: "Es esto correcto?",
          },
        },
        (state, { recur }, { actions }) => {
          const { confirming } = state;
          const { intent } = state.confirm;
          if (intent === "yes")
            return {
              say: {
                en: "Thank you",
                es: "Gracias",
              },
              [confirming.name]: { confirmed: true },
            };
          if (intent === "no") {
            if (confirming.retry > 2)
              return {
                say: {
                  en: "It's fine. I'll ask you later.",
                  es: "Esta bien, le preguntaremos en otra ocasion.",
                },
              };
            else
              return [
                {
                  say: {
                    en: "Ok, let's try again.",
                    es: "Ok, tratemos de nuevo.",
                  },
                },
                actions[confirming.name],
              ];
          }
          if (recur < 3) return $confirm(state, confirming.name);
          return {
            say: {
              en: "Let's continue",
              es: "Continuemos",
            },
          };
        },
      ];
    },
  ];
};

module.exports = {
  authenticate,
  verifyPhone,
  getPhone,
  $confirm,
};
