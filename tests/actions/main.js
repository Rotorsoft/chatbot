module.exports = {
  main: (state, scope, { params, actions }) => {
    const name = params.name;
    params.firstname = (name || "").split(" ")[0];

    return [
      {
        say: {
          en: "Hi.",
          es: "Hola.",
        },
      },
      actions.authenticate,
      function begin({ authenticate = {} }) {
        if (authenticate.intent === "yes") {
          return [
            {
              say: {
                en: `Hi ${params.firstname}, welcome back.`,
                es: `Hola ${params.firstname}, bienvenido de vuelta.`,
              },
            },
          ];
        }
      },
      function end() {
        return {
          say: {
            en: "Good bye.",
            es: "Adios.",
          },
        };
      },
    ];
  },
};
