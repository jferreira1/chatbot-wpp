const fs = require("fs");

const XLSX = require("xlsx");
const qrcode = require("qrcode-terminal");
const express = require("express");
const { Client } = require("whatsapp-web.js");

const respostas = require("./modules/respostas.js");
const utils = require("./modules/util.js");

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

const SESSION_FILE_PATH = "./session.json";

let sessionData;
if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionData = require(SESSION_FILE_PATH);
}

const client = new Client({
  puppeteer: {
    args: ["--no-sandbox"],
  },
  session: sessionData,
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("authenticated", (session) => {
  // Salva a sessão em arquivo.

  sessionData = session;

  fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
    if (err) {
      console.error(err);
    }
  });
});

client.on("auth_failure", (msg) => {
  // Fired if session restore was unsuccessfull
  console.error("AUTHENTICATION FAILURE", msg);
});

let planilha;
let users = new Map();

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

client.on("message", async (msg) => {
  console.log("Mensagem recebida!\n" + "Message type: " + msg.type);

  isUserRegistred = users.has(msg.from);
  isMessageTest = Boolean(msg.body.trim().toLowerCase() === "teste");
  //isE2Notification = Boolean(msg.type == "e2enotification");

  if (!isUserRegistred && isMessageTest) {
    users.set(msg.from, {
      ordem: 0,
      eventoSelecionado: null,
      ordemEventos: 0,
      isSubgrupoIngressos: false,
    });

    let userCurrentOrdem = users.get(msg.from).ordem;
    if (userCurrentOrdem === 0) {
      let resposta;
      resposta = respostas.msgOrdemZero(msg);
      client.sendMessage(msg.from, resposta);
      utils.incrementaOrdemUser(msg.from, users);
    }

    if (users.get(msg.from).ordem === 1) {
      let resposta;
      [resposta, users] = respostas.msgOrdemUm(planilha, msg, users);
      client
        .sendMessage(msg.from, resposta)
        .then(utils.incrementaOrdemUser(msg.from, users));
    }
  } else if (isUserRegistred) {
    let userCurrentOrdem = users.get(msg.from).ordem;
    const conteudoDaMsgMin = msg.body.trim().toLowerCase();

    const regexVoltar = /^((volt)|(votl))\w{0,3}$/i;
    const regexMais = /^((mais)|(mas))$/i;
    const regexMenu = /^((menu)|(princip))\w{0,3}$/i;

    const isVoltar = regexVoltar.test(conteudoDaMsgMin);
    const isMais = regexMais.test(conteudoDaMsgMin);
    const isMenu = regexMenu.test(conteudoDaMsgMin);

    let isSubgrupoIngressos = users.get(msg.from).isSubgrupoIngressos;

    if (isMenu) {
      users = utils.resetUser(msg.from, users);
    }
    if (isVoltar || (userCurrentOrdem === 4 && !isSubgrupoIngressos)) {
      userCurrentOrdem = users.get(msg.from).ordem;
      if (userCurrentOrdem === 2) {
        users = utils.decrementaOrdemUser(msg.from, users);
        users = utils.decrementaOrdemEventos(msg.from, users);
      }
      if (userCurrentOrdem === 3) {
        let currentOrdemEventos = users.get(msg.from).ordemEventos;
        users = utils.decrementaOrdemUser(msg.from, users, 2);
        users = utils.decrementaOrdemEventos(
          msg.from,
          users,
          currentOrdemEventos
        );
        users.set(msg.from, {
          ...users.get(msg.from),
          eventoSelecionado: null,
        });
      }

      if (userCurrentOrdem === 4) {
        users = utils.decrementaOrdemUser(msg.from, users, 2);
        users.set(users.get(msg.from), {
          ...users.get(msg.from),
          isSubgrupoIngressos: false,
        });
      }
    }

    userCurrentOrdem = users.get(msg.from).ordem;
    let eventoSelecionado = users.get(msg.from).eventoSelecionado;

    if (userCurrentOrdem === 1) {
      let resposta;
      [resposta, users] = respostas.msgOrdemUm(planilha, msg, users);
      client
        .sendMessage(msg.from, resposta)
        .then(utils.incrementaOrdemUser(msg.from, users));
    }
    if (userCurrentOrdem === 2) {
      if (isMais) {
        utils.decrementaOrdemUser(msg.from, users);
        utils.incrementaOrdemEventos(msg.from, users);
        let resposta;
        [resposta, users] = respostas.msgOrdemUm(planilha, msg, users);

        client
          .sendMessage(msg.from, resposta)
          .then(utils.incrementaOrdemUser(msg.from, users));
      } else {
        let resposta;
        [resposta, users] = respostas.msgOrdemDois(planilha, msg, users);
        client
          .sendMessage(msg.from, resposta)
          .then((msgSent) => {
            console.log(msgSent);
            client.sendMessage(
              msg.from,
              'Digite "voltar" ou "menu" retornar ao menu principal e selecionar um novo evento.'
            );
            utils.incrementaOrdemUser(msg.from, users);
          })
          .catch((error) => {
            console.log(error.message);
          });
      }
    }
    if (userCurrentOrdem === 3) {
      let resposta;
      [resposta, users] = respostas.msgOrdemTres(eventoSelecionado, msg, users);
      client.sendMessage(msg.from, resposta).then((msgSent) => {
        utils.incrementaOrdemUser(msg.from, users);
        client.sendMessage(
          msg.from,
          respostas.msgVoltarEMenu(eventoSelecionado)
        );
      });
    }
    if (userCurrentOrdem === 4) {
      isSubgrupoIngressos = users.get(msg.from).isSubgrupoIngressos;
      if (isSubgrupoIngressos) {
        [resposta, users] = respostas
          .msgSubgrupoIngressos(eventoSelecionado, msg, users)
          .then((msgSent) => {
            client.sendMessage(
              msg.from,
              respostas.msgVoltarEMenu(eventoSelecionado)
            );
          });
      }

      /*
      let resposta;
      resposta = respostas.msgOrdemQuatro(eventoSelecionado);
      client.sendMessage(msg.from, resposta);
      */
    }
  } else {
    return;
  }
});

client.initialize();

module.exports = { users };
