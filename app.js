const fs = require("fs");

const XLSX = require("xlsx");
const qrcode = require("qrcode-terminal");
const express = require("express");
const { Client } = require("whatsapp-web.js");

const respostas = require("./modules/respostas.js");
const validators = require("./modules/validators.js");
const user = require("./modules/user.js");
const utils = require("./modules/util.js");

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

//app.use(express.static("archives"));

const SESSION_FILE_PATH = "./archives/session.json";

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
    const workbook = XLSX.readFile("./archives/planilha_eventos.xlsx");
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
  console.log(msg.body);

  const isMessageValid = msg.type === "chat";

  if (isMessageValid) {
    let isUserRegistred = users.has(msg.from);
    let isMessageTest = msg.body.trim().toLowerCase() === "teste";

    if (!isUserRegistred && !isMessageTest) {
      return;
    }

    if (!isUserRegistred && isMessageTest) {
      // Registra usuário
      users.set(msg.from, {
        ordem: 0,
        ordemEventos: 0,
        eventoSelecionado: null,
        infoSelecionada: null,
        isSubgrupoIngressos: false,
      });

      // Manda mensagem de boas-vindas
      let resposta = respostas.msgBoasVindas();
      await client.sendMessage(msg.from, resposta);
    }
    let eventoSelecionado;

    let isMessageMenu = msg.body.trim().toLowerCase() === "menu";
    if (isMessageMenu) {
      users = utils.resetUser(msg.from, users);
    }

    let isMessageVoltar = msg.body.trim().toLowerCase() === "voltar";
    if (isMessageVoltar) {
      let ordemUser = users.get(msg.from).ordem;
      switch (ordemUser) {
        case 1:
          utils.decrementaOrdemUser(msg.from, users);
          users.set(msg.from, {
            ...users.get(msg.from),
            ordemEventos: 0,
            eventoSelecionado: null,
            infoSelecionada: null,
            isSubgrupoIngressos: false,
          });
          break;
        case 2:
          utils.decrementaOrdemUser(msg.from, users);
          users.set(msg.from, {
            ...users.get(msg.from),
            infoSelecionada: null,
            isSubgrupoIngressos: false,
          });
          break;
        case 3:
          infoSelecionada = users.get(msg.from).infoSelecionada;
          if (infoSelecionada.toLowerCase() === "ingressos") {
            utils.decrementaOrdemUser(msg.from, users, 2);
          } else {
            utils.decrementaOrdemUser(msg.from, users, 2);
            users.set(msg.from, {
              ...users.get(msg.from),
              infoSelecionada: null,
              isSubgrupoIngressos: false,
            });
          }

          break;
        default:
          console.log("Não foi possível atender ao comando de 'voltar'");
          break;
      }
    }

    let ordemUser = users.get(msg.from).ordem;
    switch (ordemUser) {
      case 0:
        let isMessageMais = msg.body.trim().toLowerCase() === "mais";
        if (isMessageMais) {
          utils.incrementaOrdemEventos(msg.from, users);
        }
        let isSelecaoEventoValida = validators.validacaoSelecionaEvento(
          msg,
          planilha
        );

        if (isSelecaoEventoValida) {
          users = user.setEventoSelecionado(msg, planilha, users);

          let resposta = respostas.msgInfosEvento(msg, users);
          await client.sendMessage(msg.from, resposta);
          utils.incrementaOrdemUser(msg.from, users);
        } else {
          let resposta;
          resposta = respostas.msgApresentaEventos(planilha, msg, users);
          await client.sendMessage(msg.from, resposta);
        }
        break;
      case 1:
        eventoSelecionado = users.get(msg.from).eventoSelecionado;
        if (eventoSelecionado) {
          let isSelecaoInfoValida = validators.validacaoSelecionaInfoEvento(
            msg,
            eventoSelecionado
          );
          if (isSelecaoInfoValida) {
            users = user.setInfoSelecionada(msg, eventoSelecionado, users);
            infoSelecionada = users.get(msg.from).infoSelecionada;
            if (infoSelecionada.toLowerCase() === "ingressos")
              utils.setSubgrupoIngressos(msg.from, users, true);
            let resposta = respostas.msgInfoSelecionada(msg, users);
            await client.sendMessage(msg.from, resposta);
            utils.incrementaOrdemUser(msg.from, users);
          } else {
            let isSubgrupoIngressos = users.get(msg.from).isSubgrupoIngressos;
            if (isSubgrupoIngressos) {
              let resposta = respostas.msgInfoSelecionada(msg, users);
              await client.sendMessage(msg.from, resposta);
              utils.incrementaOrdemUser(msg.from, users);
              return;
            }
            let resposta = respostas.msgInfosEvento(msg, users);
            await client.sendMessage(msg.from, resposta);
          }
        }
        break;
      case 2:
        let isSubgrupoIngressos = users.get(msg.from).isSubgrupoIngressos;
        if (isSubgrupoIngressos) {
          eventoSelecionado = users.get(msg.from).eventoSelecionado;
          let isSelecaoTipoIngressoValida =
            validators.validacaoSelecionaTipoIngresso(msg, eventoSelecionado);
          if (isSelecaoTipoIngressoValida) {
            let resposta = respostas.msgSubgrupoIngressos(
              msg,
              eventoSelecionado
            );
            await client.sendMessage(msg.from, resposta);
            utils.incrementaOrdemUser(msg.from, users);
          } else {
            // Mensagem inválida, repete a resposta da informação selecionada;
            let resposta = respostas.msgInfoSelecionada(msg, eventoSelecionado);
            await client.sendMessage(msg.from, resposta);
          }
        } else {
          eventoSelecionado = users.get(msg.from).eventoSelecionado;
          let resposta = respostas.msgVoltarEMenu(eventoSelecionado);
          await client.sendMessage(msg.from, resposta);
        }
        break;
      case 3:
        eventoSelecionado = users.get(msg.from).eventoSelecionado;
        let resposta = respostas.msgVoltarEMenu(eventoSelecionado);
        await client.sendMessage(msg.from, resposta);
        break;
    }
  }
});

client.initialize();
