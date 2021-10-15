const fs = require("fs");
const XLSX = require("xlsx");
const qrcode = require("qrcode-terminal");

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

const { Client } = require("whatsapp-web.js");

const SESSION_FILE_PATH = "./session.json";

/*
let sessionData;
if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionData = require(SESSION_FILE_PATH);
}
*/

const client = new Client({
  puppeteer: {
    args: ["--no-sandbox"],
  },
  //session: sessionData,
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("authenticated", (session) => {
  // Salva a sessão em arquivo.
  /*
  sessionData = session;
  
  fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
    if (err) {
      console.error(err);
    }
  });
  */
});

client.on("auth_failure", (msg) => {
  // Fired if session restore was unsuccessfull
  console.error("AUTHENTICATION FAILURE", msg);
});

let planilha;
const users = new Map();

client.on("ready", () => {
  try {
    const workbook = XLSX.readFile("./archives/teste_evento2.xlsx");
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    planilha = XLSX.utils.sheet_to_json(worksheet);
    planilha = planilha.filter((linha) => {
      if (linha["EVENTOS"]) {
        return linha;
      }
    });
  } catch (error) {
    console.log(error.message);
  } finally {
    console.log("Client is ready!");
  }
});

// Funções de respostas
const msgOrdemZero = (msg) => {
  const fraseCumprimento = "Olá, tudo bem?";
  client.sendMessage(msg.from, fraseCumprimento);
};

const msgOrdemUm = (planilha, msg) => {
  const msgCabecalho = "Selecione um evento: \n\n";
  const arrCumprimento = [msgCabecalho];

  for (let i = 0; i < planilha.length; i++) {
    arrCumprimento.push(i + 1 + " - " + planilha[i]["EVENTOS"] + "\n");
  }

  client.sendMessage(msg.from, arrCumprimento.join(""));
};

const msgOrdemDois = (planilha, msg) => {
  try {
    const regexNumero = /^\d+/;
    let isNumeroEncontrado = regexNumero.test(msg.body.trim());
    let numeroEncontrado = msg.body.trim().match(regexNumero);
    if (numeroEncontrado) {
      numeroEncontrado = numeroEncontrado[0];
    }

    if (
      isNumeroEncontrado &&
      0 < parseInt(numeroEncontrado) &&
      parseInt(numeroEncontrado) <= planilha.length
    ) {
      const eventoSelecionado = planilha[numeroEncontrado - 1];
      users.set(msg.from, {
        ...users.get(msg.from),
        eventoSelecionado: eventoSelecionado,
      });

      const msgCabecalho = `O que deseja saber sobre o evento do ${eventoSelecionado["EVENTOS"]}?\n\n`;
      const arrDetalhesEvento = [msgCabecalho];

      const keysDoEventoSelecionado = Object.keys(eventoSelecionado);
      keysFiltradas = keysDoEventoSelecionado.filter((key) => {
        return key.toLowerCase() != "eventos";
      });

      keysFiltradas.forEach((key, index) => {
        arrDetalhesEvento.push(index + 1 + " - " + key + "\n");
      });
      arrDetalhesEvento.push('\nDigite "voltar" para retornar aos eventos.');

      return client.sendMessage(msg.from, arrDetalhesEvento.join(""));
    } else if (isNumeroEncontrado) {
      client.sendMessage(
        msg.from,
        "Desculpa, o número informado não corresponde a um evento"
      );
      return;
    } else {
      client.sendMessage(msg.from, "Desculpa, houve um erro na consulta.");
      return;
    }
  } catch (error) {
    console.log(error);
  }
};

const dataHoraEvento = (eventoSelecionado) => {
  const ExcelDateToJSDate = (d) => {
    let date = new Date(Math.round((d - 25569) * 864e5));
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date;
  };

  dataEvento = ExcelDateToJSDate(eventoSelecionado["DATA E HORA"]);

  const diaDaSemana = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
  ];

  const horaFormatada = dataEvento.getHours() + ":" + dataEvento.getMinutes();
  const dataFormatada =
    dataEvento.getDate() +
    "/" +
    parseInt(dataEvento.getMonth() + 1) +
    "/" +
    dataEvento.getFullYear();

  return `O evento do ${eventoSelecionado["EVENTOS"]} será realizado ${
    diaDaSemana[dataEvento.getDay()]
  } no dia ${dataFormatada} às ${horaFormatada}h.`;
};

const msgOrdemTres = (eventoSelecionado, msg) => {
  try {
    const regexNumero = /^\d+/;
    let isNumeroEncontrado = regexNumero.test(msg.body.trim());
    let numeroEncontrado = msg.body.trim().match(regexNumero);
    if (numeroEncontrado) {
      numeroEncontrado = parseInt(numeroEncontrado[0]);
    }

    const keysDoEventoSelecionado = Object.keys(eventoSelecionado);
    let keysFiltradas = keysDoEventoSelecionado.filter((key) => {
      return key.toLowerCase() != "eventos";
    });

    if (
      isNumeroEncontrado &&
      0 < numeroEncontrado &&
      numeroEncontrado <= keysFiltradas.length
    ) {
      if (numeroEncontrado === 1) {
        const fraseDataEvento = dataHoraEvento(eventoSelecionado);
        client.sendMessage(msg.from, fraseDataEvento);
      }
      if (numeroEncontrado === 2) {
        const fraseLocalEvento = `O evento do ${eventoSelecionado["EVENTOS"]} será realizado na ${eventoSelecionado["LOCAL"]}.`;
        client.sendMessage(msg.from, fraseLocalEvento);
      }
      if (numeroEncontrado === 3) {
        const fraseIngressoAntecipado = `O ingresso antecipado custa R$ ${eventoSelecionado[
          "INGRESSOS ANTECIPADOS"
        ].toFixed(2)}.`;
        client.sendMessage(msg.from, fraseIngressoAntecipado);
      }
      if (numeroEncontrado === 4) {
        const fraseIngressoNaHora = `O ingresso na hora vai custar R$ ${eventoSelecionado[
          "INGRESSOS NA HORA"
        ].toFixed(2)}.`;
        client.sendMessage(msg.from, fraseIngressoNaHora);
      }
      if (numeroEncontrado === 5) {
        const frasePrecoCamarote = `O camarote está custando R$ ${eventoSelecionado[
          "CAMAROTES"
        ].toFixed(2)}.`;
        client.sendMessage(msg.from, frasePrecoCamarote);
      }
      if (numeroEncontrado === 6) {
        let frasePrecoPromocional;
        if (
          eventoSelecionado["PROMOÇÃO ANIVERSARIANTE"] != "" &&
          eventoSelecionado["PROMOÇÃO ANIVERSARIANTE"].toUpperCase() != "XXXXXX"
        ) {
          frasePrecoPromocional = `A entrada de aniversariantes custa ${eventoSelecionado["PROMOÇÃO ANIVERSARIANTE"]}.`;
        } else {
          frasePrecoPromocional = `Não há preço promocional disponível para o evento do ${eventoSelecionado["EVENTOS"]}.`;
        }
        client.sendMessage(msg.from, frasePrecoPromocional);
      }
    } else {
      client.sendMessage(
        msg.from,
        "Desculpa, o número informado não corresponde às opções."
      );
    }
  } catch (error) {
    console.log(error);
  }
};

client.on("message", async (msg) => {
  console.log("Mensagem recebida!");

  if (!users.has(msg.from) && msg.body.trim().toLowerCase() === "teste") {
    users.set(msg.from, { ordem: 0 });

    if (users.get(msg.from).ordem === 0) {
      msgOrdemZero(msg);
      users.set(msg.from, { ordem: users.get(msg.from).ordem + 1 });
    }

    if (users.get(msg.from).ordem === 1) {
      msgOrdemUm(planilha, msg);
      users.set(msg.from, { ordem: users.get(msg.from).ordem + 1 });
    }
  } else if (users.has(msg.from)) {
    let ordem = users.get(msg.from).ordem;

    const regexVoltar = /(volt)\w{0,3}$/i;
    const conteudoDaMsg = msg.body.trim().toLowerCase();
    const isVoltar = regexVoltar.test(conteudoDaMsg);

    if (!isVoltar) {
      ordem = users.get(msg.from).ordem;
      if (ordem === 1) {
        msgOrdemUm(planilha, msg);
        users.set(msg.from, { ordem: ordem + 1 });
      }
      if (ordem === 2) {
        if (Boolean(msgOrdemDois(planilha, msg))) {
          users.set(msg.from, { ...users.get(msg.from), ordem: ordem + 1 });
        }
      }
      if (ordem === 3) {
        console.log(users.get(msg.from));
        msgOrdemTres(users.get(msg.from).eventoSelecionado, msg);
      }
    } else {
      users.set(msg.from, { ordem: 1 });
      ordem = users.get(msg.from).ordem;
      if (ordem === 1) {
        msgOrdemUm(planilha, msg);
        users.set(msg.from, { ordem: ordem + 1 });
      }
    }
  } else {
    return;
  }
});

client.initialize();
