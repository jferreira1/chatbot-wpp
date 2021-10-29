const utils = require("./util");

const validacaoSelecionaEvento = (msg, planilha) => {
  regexNumber = /^\d+/;
  numberFound = msg.body.trim().match(regexNumber);

  let comparadorIndex = false;
  if (numberFound && numberFound < planilha.length + 1 && numberFound > 0)
    comparadorIndex = true;

  let validTokens = [];
  planilha.forEach((el) => {
    validTokens.push(el["EVENTOS"]);
  });
  let comparadorString = validTokens.some((el) => {
    return el.toLowerCase() === msg.body.trim().toLowerCase();
  });

  return comparadorString || comparadorIndex;
};

const validacaoSelecionaInfoEvento = (msg, eventoSelecionado) => {
  let regexNumber = /^\d+/;
  let numberFound = msg.body.trim().match(regexNumber);
  let regexDataHora = /(data)|(hora)/gim;
  let isStringDataHora = msg.body.trim().match(regexDataHora);

  let regexPromocaoAniversariante =
    /(anivers[a|á]rio)|(promo[c|ç][a|ã]o)|(aniversariante)/gim;
  let isAniversariante = msg.body.trim().match(regexPromocaoAniversariante);

  let comparadorIndex = false;
  let eventosFiltrados = utils.filtroPropriedades(eventoSelecionado);
  if (
    numberFound &&
    numberFound < eventosFiltrados.length + 1 &&
    numberFound > 0
  )
    comparadorIndex = true;
  let comparadorString = eventosFiltrados.some((el) => {
    return el.toLowerCase() === msg.body.trim().toLowerCase();
  });
  if (isStringDataHora || isAniversariante) {
    comparadorString = true;
  }

  return comparadorString || comparadorIndex;
};

const validacaoSelecionaTipoIngresso = (msg, eventoSelecionado) => {
  regexNumber = /^\d+/;
  numberFound = msg.body.trim().match(regexNumber);
  let comparadorIndex = false;

  let tiposIngressos = utils.filtroIngressos(eventoSelecionado);
  if (numberFound && numberFound < tiposIngressos.length + 1 && numberFound > 0)
    comparadorIndex = true;

  tiposIngressos = utils.filtroIngressos(eventoSelecionado);
  let comparadorString = tiposIngressos.some((el) => {
    return el.toLowerCase() === msg.body.trim().toLowerCase();
  });

  return comparadorString || comparadorIndex;
};

module.exports = {
  validacaoSelecionaEvento,
  validacaoSelecionaInfoEvento,
  validacaoSelecionaTipoIngresso,
};
