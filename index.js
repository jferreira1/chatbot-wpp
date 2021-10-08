const fs = require("fs");
const qrcode = require("qrcode-terminal");

const { Client, MessageMedia } = require("whatsapp-web.js");

const SESSION_FILE_PATH = "./session.json";

let sessionData;
if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionData = require(SESSION_FILE_PATH);
}

const client = new Client({
  puppeteer: {
    executablePath:
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  },
  session: sessionData,
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("authenticated", (session) => {
  // Save the session object however you prefer.
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

client.on("ready", () => {
  console.log("Client is ready!");
});

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}

const comandos = {
  casimito(msg) {
    const numeroAleatorio = getRandomIntInclusive(1, 7);
    const extensao =
      numeroAleatorio === 3 || numeroAleatorio === 5 || numeroAleatorio === 7
        ? ".mp4"
        : ".jpg";
    const media = MessageMedia.fromFilePath(
      "./media/" + numeroAleatorio + extensao
    );
    client.sendMessage(msg.from, media);
    console.log(media.filename);
  },
  teste(msg) {
    XLSX = require("xlsx");
    const workbook = XLSX.readFile("./teste_evento2.xlsx");
    let worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const planilhaJson = XLSX.utils.sheet_to_json(worksheet);

    /*
    const csv = require("csv-parser");
    fs.createReadStream("./archives/planilha.csv")
      .pipe(csv())
      .on("data", (row) => {
        console.log(row);
        client.sendMessage(
          msg.from,
          row["Nome"] +
            "\n" +
            row["Data"] +
            "- Ingresso: " +
            row["Valor"] +
            "\n Endereço: " +
            row["Endereco"]
        );
      })
      .on("end", () => {
        console.log("CSV file successfully processed");
      });
      */
  },
  ping(msg) {
    msg.reply("pong");
  },
  default: "Desculpa, comando inválido!",
};

client.on("message", async (msg) => {
  console.log("Mensagem recebida!", msg);
  const comandoFunction = comandos[msg.body.trim().toLowerCase()];
  if (comandoFunction) {
    comandoFunction(msg);
  } else {
    console.log("Comando inválido");
  }
  /*
  if (msg.body === "!casimito") {
     const numeroAleatorio = getRandomIntInclusive(1, 7);
    const extensao =
      numeroAleatorio === 3 || numeroAleatorio === 5 || numeroAleatorio === 7
        ? ".mp4"
        : ".jpg";
    const media = MessageMedia.fromFilePath(
      "./media/" + numeroAleatorio + extensao
    );
    client.sendMessage(msg.from, media);
    console.log(media.filename); 
  } else {
    console.log("Mensagem recebida", msg.body);
  }
  */
});

client.initialize();
