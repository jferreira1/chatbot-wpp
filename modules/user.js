const utils = require("./util.js");

const setEventoSelecionado = (msg, planilha, users) => {
  const regexNumero = /^\d+/;
  let numeroEncontrado = msg.body.trim().match(regexNumero);
  if (numeroEncontrado) numeroEncontrado = parseInt(numeroEncontrado[0]);

  if (0 < numeroEncontrado && numeroEncontrado <= planilha.length) {
    let eventoSelecionado = planilha[numeroEncontrado - 1];
    users.set(msg.from, {
      ...users.get(msg.from),
      eventoSelecionado: eventoSelecionado,
    });
  }

  let validTokens = [];
  planilha.forEach((el) => {
    validTokens.push(el["EVENTOS"]);
  });

  let comparadorString = validTokens.some((el) => {
    return el.toLowerCase() === msg.body.trim().toLowerCase();
  });

  if (comparadorString) {
    eventoSelecionado = planilha.find((el) => {
      return el["EVENTOS"].toLowerCase() === msg.body.trim().toLowerCase();
    });

    users.set(msg.from, {
      ...users.get(msg.from),
      eventoSelecionado: eventoSelecionado,
    });
  }
  return users;
};

const setInfoSelecionada = (msg, eventoSelecionado, users) => {
  const regexNumero = /^\d+/;
  let numeroEncontrado = msg.body.trim().match(regexNumero);
  if (numeroEncontrado) numeroEncontrado = parseInt(numeroEncontrado[0]);

  let regexDataHora = /(data)|(hora)/gim;
  let stringDataHora = msg.body.trim().match(regexDataHora);

  let regexPromocaoAniversariante =
    /(anivers[a|á]rio)|(promo[c|ç][a|ã]o)|(aniversariante)/gim;
  let isAniversariante = msg.body.trim().match(regexPromocaoAniversariante);

  let filtroPropriedades = utils.filtroPropriedades(eventoSelecionado);
  let infoSelecionada;
  if (
    0 < numeroEncontrado &&
    numeroEncontrado <= filtroPropriedades.length + 1
  ) {
    infoSelecionada = filtroPropriedades[numeroEncontrado - 1];
    users.set(msg.from, {
      ...users.get(msg.from),
      infoSelecionada: infoSelecionada,
    });
  }
  let comparadorString = filtroPropriedades.some((el) => {
    return el.toLowerCase() === msg.body.trim().toLowerCase();
  });

  if (stringDataHora) {
    comparadorString = true;
  }

  if (comparadorString) {
    infoSelecionada = filtroPropriedades.find((el) => {
      return el.toLowerCase() === msg.body.trim().toLowerCase();
    });

    // Casos tratamento de RegEX
    if (stringDataHora) {
      infoSelecionada = filtroPropriedades.find((el) => {
        return el.toLowerCase() === "data e hora";
      });
    }
    if (isAniversariante) {
      infoSelecionada = filtroPropriedades.find((el) => {
        return el.toLowerCase() === "promoção aniversariante";
      });
    }

    users.set(msg.from, {
      ...users.get(msg.from),
      infoSelecionada: infoSelecionada,
    });
  }

  return users;
};

module.exports = {
  setEventoSelecionado,
  setInfoSelecionada,
};
