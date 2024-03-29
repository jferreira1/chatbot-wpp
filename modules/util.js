const resetUser = (userKey, users) => {
  users.set(userKey, {
    ordem: 0,
    ordemEventos: 0,
    eventoSelecionado: null,
    infoSelecionada: null,
    isSubgrupoIngressos: false,
  });
  return users;
};

const incrementaOrdemUser = (userKey, users, increment = 1) => {
  users.set(userKey, {
    ...users.get(userKey),
    ordem: users.get(userKey).ordem + increment,
  });
  return users;
};

const decrementaOrdemUser = (userKey, users, decrement = 1) => {
  let userCurrentOrdem = users.get(userKey).ordem;
  if (userCurrentOrdem >= 0 + decrement) {
    users.set(userKey, {
      ...users.get(userKey),
      ordem: users.get(userKey).ordem - decrement,
    });
  }
  return users;
};

const incrementaOrdemEventos = (userKey, users, increment = 1) => {
  users.set(userKey, {
    ...users.get(userKey),
    ordemEventos: users.get(userKey).ordemEventos + increment,
  });
  return users;
};

const decrementaOrdemEventos = (userKey, users, decrement = 1) => {
  let userCurrentOrdemEventos = users.get(userKey).ordemEventos;
  if (userCurrentOrdemEventos >= 0 + decrement) {
    users.set(userKey, {
      ...users.get(userKey),
      ordemEventos: users.get(userKey).ordemEventos - decrement,
    });
  }
  return users;
};

const setSubgrupoIngressos = (userKey, users, state) => {
  try {
    if (typeof state === "boolean") {
      users.set(userKey, { ...users.get(userKey), isSubgrupoIngressos: state });
    } else {
      throw "Parâmetro 'state' não é um booleano";
    }
  } catch (error) {
    console.log(error);
  } finally {
    return users;
  }
};

const filtroPropriedades = (eventoSelecionado) => {
  const keysDoEventoSelecionado = Object.keys(eventoSelecionado);
  const propriedadesFiltradas = keysDoEventoSelecionado.filter((key) => {
    return (
      key.toLowerCase() != "eventos" &&
      key.toLowerCase() != "ingressos antecipados"
    );
  });
  const elIndex = propriedadesFiltradas.findIndex(
    (el) => el.toLowerCase() === "ingressos na hora"
  );
  propriedadesFiltradas[elIndex] = "INGRESSOS";
  return propriedadesFiltradas;
};

const filtroIngressos = (eventoSelecionado) => {
  const keysDoEventoSelecionado = Object.keys(eventoSelecionado);
  const ingressosFiltradsos = keysDoEventoSelecionado.slice(3, 5);
  return ingressosFiltradsos;
};

module.exports = {
  resetUser,
  incrementaOrdemUser,
  decrementaOrdemUser,
  incrementaOrdemEventos,
  decrementaOrdemEventos,
  setSubgrupoIngressos,
  filtroPropriedades,
  filtroIngressos,
};
