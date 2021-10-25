const frases = require("./frases.js");
const utils = require("./util.js");

const msgOrdemZero = (msg) => {
  const fraseCumprimento = "Olá, tudo bem?";
  return fraseCumprimento;
};

const msgOrdemUm = (planilha, msg, users) => {
  try {
    const msgCabecalho = "Selecione um evento: \n\n";
    const arrCumprimento = [msgCabecalho];

    for (let i = 0; i < planilha.length; i++) {
      arrCumprimento.push(i + 1 + " - " + planilha[i]["EVENTOS"] + "\n");
    }

    // Limitador de quantidade de eventos apresentados na mensagem de resposta
    const slicesCumprimentos = [];
    let eventosPorMsg = 3;
    for (let i = 1; i < arrCumprimento.length; i += eventosPorMsg) {
      slicesCumprimentos.push(arrCumprimento.slice(i, i + eventosPorMsg));
    }

    let ordemEventos = users.get(msg.from).ordemEventos;
    ordemEventos = ordemEventos % slicesCumprimentos.length;

    if (slicesCumprimentos[ordemEventos]) {
      if (slicesCumprimentos[ordemEventos + 1]) {
        resposta =
          msgCabecalho +
          slicesCumprimentos[ordemEventos].join("") +
          '\nDigite "mais" para ver mais eventos disponíveis.';
        return [resposta, users];
      } else {
        resposta = msgCabecalho + slicesCumprimentos[ordemEventos].join("");
        return [resposta, users];
      }
    } else {
      users.set(msg.from, { ...users.get(msg.from), ordemEventos: 0 });
      throw "Não foi possível encontrar um evento cadastrado na planilha.";
    }
  } catch (error) {
    console.log(error);
    return ["Desculpa, houve um erro na consulta.", users];
  }
};

const msgOrdemDois = (planilha, msg, users) => {
  try {
    const regexNumero = /^\d+/;

    // Define o evento selecionado
    const isNumeroEncontrado = regexNumero.test(msg.body.trim());
    let numeroEncontrado = msg.body.trim().match(regexNumero);
    if (numeroEncontrado) numeroEncontrado = parseInt(numeroEncontrado[0]);

    if (
      isNumeroEncontrado &&
      0 < numeroEncontrado &&
      numeroEncontrado <= planilha.length
    ) {
      const eventoSelecionado = planilha[numeroEncontrado - 1];
      users.set(msg.from, {
        ...users.get(msg.from),
        eventoSelecionado: eventoSelecionado,
      });

      // Define mensagem de resposta
      const msgCabecalho = `O que deseja saber sobre o evento do ${eventoSelecionado["EVENTOS"]}?\n\n`;
      const arrDetalhesEvento = [msgCabecalho];

      // Filtro de propriedades a serem oferecidas para o usuário
      propriedadesFiltradas = utils.filtroPropriedades(eventoSelecionado);

      propriedadesFiltradas.forEach((key, index) => {
        arrDetalhesEvento.push(index + 1 + " - " + key + "\n");
      });

      arrDetalhesEvento.push('\nDigite "voltar" para retornar aos eventos.');
      return [arrDetalhesEvento.join(""), users];
    } else if (isNumeroEncontrado) {
      return [
        "Desculpa, o número informado não corresponde a um evento",
        users,
      ];
    } else {
      return ["Desculpa, houve um erro na consulta.", users];
    }
  } catch (error) {
    console.log(error);
  }
};

const msgOrdemTres = (eventoSelecionado, msg, users) => {
  try {
    const regexNumero = /^\d+/;
    const isNumeroEncontrado = regexNumero.test(msg.body.trim());
    let numeroEncontrado = msg.body.trim().match(regexNumero);
    if (numeroEncontrado) numeroEncontrado = parseInt(numeroEncontrado[0]);

    propriedadesFiltradas = utils.filtroPropriedades(eventoSelecionado);

    if (
      isNumeroEncontrado &&
      0 < numeroEncontrado &&
      numeroEncontrado <= propriedadesFiltradas.length
    ) {
      // Data e Hora
      if (numeroEncontrado === 1) {
        const fraseDataEvento = frases.dataHoraEvento(eventoSelecionado);
        return [fraseDataEvento, users];
      }
      // Local
      if (numeroEncontrado === 2) {
        const fraseLocalEvento = `O evento do ${eventoSelecionado["EVENTOS"]} será realizado na ${eventoSelecionado["LOCAL"]}.`;
        return [fraseLocalEvento, users];
      }
      // Ingressos
      if (numeroEncontrado === 3) {
        const fraseOpcoesIngressos =
          "Selecione o tipo de informação que deseja consultar:\n\n" +
          "1 - Valores antecipados\n" +
          "2 - Valores na hora do evento\n";
        utils.setSubgrupoIngressos(true);
        return [fraseOpcoesIngressos, users];
      }
      // Camarotes
      if (numeroEncontrado === 4) {
        const frasePrecoCamarote = `O camarote está custando R$ ${eventoSelecionado[
          "CAMAROTES"
        ].toFixed(2)}.`;
        return [frasePrecoCamarote, users];
      }
      // Promoção aniversariante
      if (numeroEncontrado === 5) {
        let frasePrecoPromocional;
        if (
          eventoSelecionado["PROMOÇÃO ANIVERSARIANTE"] != "" &&
          eventoSelecionado["PROMOÇÃO ANIVERSARIANTE"].toUpperCase() != "XXXXXX"
        ) {
          frasePrecoPromocional = `A entrada de aniversariantes custa ${eventoSelecionado["PROMOÇÃO ANIVERSARIANTE"]}.`;
        } else {
          frasePrecoPromocional = `Não há preço promocional disponível para o evento do ${eventoSelecionado["EVENTOS"]}.`;
        }
        return [frasePrecoPromocional, users];
      }
    } else {
      return ["Desculpa, o número informado não corresponde às opções.", users];
    }
  } catch (error) {
    console.log(error);
  }
};

const msgSubgrupoIngressos = (eventoSelecionado, msg, users) => {
  try {
    const regexNumero = /^\d+/;
    const isNumeroEncontrado = regexNumero.test(msg.body.trim());
    let numeroEncontrado = msg.body.trim().match(regexNumero);
    if (numeroEncontrado) numeroEncontrado = parseInt(numeroEncontrado[0]);

    if (isNumeroEncontrado && 0 < numeroEncontrado && numeroEncontrado <= 2) {
      if (numeroEncontrado === 1) {
        const fraseIngressoAntecipado = `O ingresso antecipado custa R$ ${eventoSelecionado[
          "INGRESSOS ANTECIPADOS"
        ].toFixed(2)}.`;
        return [fraseIngressoAntecipado, users];
      }
      if (numeroEncontrado === 2) {
        const fraseIngressoNaHora = `O ingresso na hora vai custar R$ ${eventoSelecionado[
          "INGRESSOS NA HORA"
        ].toFixed(2)}.`;
        return [fraseIngressoNaHora, users];
      } else {
        return [
          "Desculpa, o número informado não corresponde às opções disponíveis.",
          users,
        ];
      }
    } else {
      return ["Desculpa, houve um erro na consulta", users];
    }
  } catch (error) {
    console.log(error);
  }
};

const msgVoltarEMenu = (eventoSelecionado) => {
  resposta = `Digite "voltar" para ver mais informações do evento do ${eventoSelecionado["EVENTOS"]} ou digite "menu" retornar ao menu principal e selecionar um novo evento.`;
  return [resposta, users];
};

module.exports = {
  msgOrdemZero,
  msgOrdemUm,
  msgOrdemDois,
  msgOrdemTres,
  msgVoltarEMenu,
  msgSubgrupoIngressos,
};
