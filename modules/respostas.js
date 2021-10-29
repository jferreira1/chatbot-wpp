const frases = require("./frases.js");
const utils = require("./util.js");

const msgBoasVindas = () => {
  const fraseCumprimento = "Olá, tudo bem?";
  return fraseCumprimento;
};

const msgApresentaEventos = (planilha, msg, users, eventosPorMsg = 10) => {
  let resposta;
  try {
    const msgCabecalho = "Sobre qual evento deseja ter mais informações: \n";
    const arrCumprimento = [msgCabecalho];

    for (let i = 0; i < planilha.length; i++) {
      arrCumprimento.push("\n" + (i + 1) + " - " + planilha[i]["EVENTOS"]);
    }
    arrCumprimento.push("\n");

    // Limitador de quantidade de eventos apresentados na mensagem de resposta
    const slicesCumprimentos = [];
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
      } else {
        resposta = msgCabecalho + slicesCumprimentos[ordemEventos].join("");
      }
    } else {
      throw "Não foi possível encontrar um evento cadastrado na planilha.";
    }
  } catch (error) {
    console.log(error);
    resposta = error.message;
  } finally {
    return resposta;
  }
};

const msgInfosEvento = (msg, users) => {
  let resposta;
  try {
    let eventoSelecionado = users.get(msg.from).eventoSelecionado;
    const msgCabecalho = `O que você deseja saber sobre o evento do ${eventoSelecionado["EVENTOS"]}?\n`;
    const arrDetalhesEvento = [msgCabecalho];

    // Filtro de propriedades a serem oferecidas para o usuário
    propriedadesFiltradas = utils.filtroPropriedades(eventoSelecionado);

    propriedadesFiltradas.forEach((key, index) => {
      arrDetalhesEvento.push("\n" + (index + 1) + " - " + key);
    });
    resposta = arrDetalhesEvento.join("").trim();
  } catch (error) {
    console.error(error);
    resposta = error.message;
  } finally {
    let footer =
      '\nDigite "voltar" ou "menu" para voltar à seleção de eventos.';
    resposta += footer;
    return resposta;
  }
};

const msgInfoSelecionada = (msg, users) => {
  let resposta;
  try {
    let infoSelecionada = users.get(msg.from).infoSelecionada;
    let eventoSelecionado = users.get(msg.from).eventoSelecionado;
    propriedadesFiltradas = utils.filtroPropriedades(eventoSelecionado);

    // Data e Hora
    if (infoSelecionada === propriedadesFiltradas[0]) {
      const fraseDataEvento = frases.dataHoraEvento(eventoSelecionado);
      resposta = fraseDataEvento;
    }
    // Local
    if (infoSelecionada === propriedadesFiltradas[1]) {
      const fraseLocalEvento = `O evento do ${eventoSelecionado["EVENTOS"]} será realizado na ${eventoSelecionado["LOCAL"]}.`;
      resposta = fraseLocalEvento;
    }
    // Ingressos
    if (infoSelecionada === propriedadesFiltradas[2]) {
      let tiposIngressos = utils.filtroIngressos(eventoSelecionado);
      const fraseOpcoesIngressos =
        "Selecione o tipo de informação que deseja consultar:\n\n" +
        `1 - ${tiposIngressos[0]}\n` +
        `2 - ${tiposIngressos[1]}`;
      resposta = fraseOpcoesIngressos;
    }
    // Camarotes
    if (infoSelecionada === propriedadesFiltradas[3]) {
      const frasePrecoCamarote = `O camarote está custando R$ ${eventoSelecionado[
        "CAMAROTES"
      ].toFixed(2)}.`;
      resposta = frasePrecoCamarote;
    }
    // Promoção aniversariante
    if (infoSelecionada === propriedadesFiltradas[4]) {
      let frasePrecoPromocional;
      if (
        eventoSelecionado["PROMOÇÃO ANIVERSARIANTE"] &&
        eventoSelecionado["PROMOÇÃO ANIVERSARIANTE"].toUpperCase() != "XXXXXX"
      ) {
        frasePrecoPromocional = `A entrada de aniversariantes custa ${eventoSelecionado["PROMOÇÃO ANIVERSARIANTE"]}.`;
      } else {
        frasePrecoPromocional = `Não há preço promocional disponível para o evento do ${eventoSelecionado["EVENTOS"]}.`;
      }
      resposta = frasePrecoPromocional;
    }
  } catch (error) {
    console.log(error);
    resposta = error.message;
  } finally {
    let footer =
      '\nDigite "voltar" para retornar ao menu de informações ou digite "menu" para voltar ao menu inicial.';
    resposta += footer;
    return resposta;
  }
};

const msgSubgrupoIngressos = (msg, eventoSelecionado) => {
  let resposta;
  try {
    let tiposIngressos = utils.filtroIngressos(eventoSelecionado);
    let tipoIngressoSelecionado;

    // Checa se a mensagem é um número
    const regexNumero = /^\d+/;
    let numeroEncontrado = msg.body.trim().match(regexNumero);
    if (numeroEncontrado) {
      numeroEncontrado = parseInt(numeroEncontrado[0]);
    }

    if (
      numeroEncontrado &&
      numeroEncontrado > 0 &&
      numeroEncontrado < tiposIngressos.length + 1
    ) {
      tipoIngressoSelecionado = tiposIngressos[numeroEncontrado - 1];
    }

    // Checa se a mensagem é uma string
    const regexIngressosAntecipado = /(ante)+\w+/gi;
    let isIngressoAntecipado = msg.body.trim().match(regexIngressosAntecipado);
    const regexIngressosNaHora = /(hora)/gi;
    let isIngressoNahora = msg.body.trim().match(regexIngressosNaHora);

    if (isIngressoAntecipado) {
      tipoIngressoSelecionado = tiposIngressos[0];
    }
    if (isIngressoNahora) {
      tipoIngressoSelecionado = tiposIngressos[1];
    }

    let infosEvento = Object.keys(eventoSelecionado);

    if (
      tipoIngressoSelecionado.toLowerCase() === infosEvento[3].toLowerCase()
    ) {
      // Ingressos antecipados
      const fraseIngressoAntecipado = `O ingresso antecipado custa *R$ ${eventoSelecionado[
        "INGRESSOS ANTECIPADOS"
      ].toFixed(2)}*.`;

      let linkWebGuiche = "xxxxxx.com/ingresso";
      let fraseLink = `\n*Compras online!* \nLink para o Webguichê: ${linkWebGuiche}`;
      let lojaParceira = "LojaParceira";
      let enderecoLojaParceira = "Shopping X, Centro - Rio de Janeiro";
      let fraseLojasParceiras = `\n*Compras nas lojas físicas!* \n${lojaParceira}: ${enderecoLojaParceira}`;
      let footer =
        '\nDigite "voltar" para voltar ao menu de informações ou digite "menu" para voltar ao menu principal.';
      resposta =
        fraseIngressoAntecipado + fraseLink + fraseLojasParceiras + footer;
    }

    if (
      tipoIngressoSelecionado.toLowerCase() === infosEvento[4].toLowerCase()
    ) {
      // Ingressos na hora
      const fraseIngressoNaHora = `O ingresso na hora vai custar R$ ${eventoSelecionado[
        "INGRESSOS NA HORA"
      ].toFixed(2)}.`;
      resposta = fraseIngressoNaHora;
    }
  } catch (error) {
    console.log(error);
    resposta = error.message;
  } finally {
    let footer =
      '\nDigite "voltar" para retornar ao menu de ingressos ou digite "menu" para voltar ao menu inicial.';
    resposta += footer;
    return resposta;
  }
};

const msgVoltarEMenu = (eventoSelecionado) => {
  let resposta;
  try {
    if (eventoSelecionado) {
      resposta = `Digite "voltar" para ver mais informações do evento do ${eventoSelecionado["EVENTOS"]} ou digite "menu" retornar ao menu principal e selecionar um novo evento.`;
    } else {
      throw "Evento não encontrado";
    }
  } catch (error) {
    console.log(error);
    resposta = error.message;
  } finally {
    return resposta;
  }
};

module.exports = {
  msgBoasVindas,
  msgApresentaEventos,
  msgInfosEvento,
  msgInfoSelecionada,
  msgVoltarEMenu,
  msgSubgrupoIngressos,
};
