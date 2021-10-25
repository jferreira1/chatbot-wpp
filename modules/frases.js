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

module.exports = { dataHoraEvento };
