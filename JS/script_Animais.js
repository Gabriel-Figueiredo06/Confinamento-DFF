import { db } from "./Firebase.js";

import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ==========================================================
// CONFIGURAÇÃO
// ==========================================================

const COLECAO_ANIMAIS = "animais";

let animaisFirestore = [];


// ==========================================================
// NORMALIZAÇÃO DO LOTE
// ==========================================================

function normalizarLote(lote) {
  const valor = (lote || "").toString().trim();

  return valor === "" ? "Sem Lote" : valor;
}


// ==========================================================
// ORDENAÇÃO DOS LOTES
// ==========================================================

function ordenarChavesDeLotes(chaves) {
  return chaves.sort((a, b) => {

    if (a === "Sem Lote") return 1;
    if (b === "Sem Lote") return -1;

    const numA = parseFloat(a);
    const numB = parseFloat(b);

    const aEhNumero = !isNaN(numA);
    const bEhNumero = !isNaN(numB);

    if (aEhNumero && bEhNumero) {
      return numA - numB;
    }

    if (aEhNumero) return -1;

    if (bEhNumero) return 1;

    return a.localeCompare(b);
  });
}


// ==========================================================
// CARREGAR ANIMAIS DO FIRESTORE
// ==========================================================

async function carregarAnimais() {

  const container = document.querySelector(".lotes-container");

  if (!container) return;

  container.innerHTML = `
    <p class="sem-dados">
      Carregando animais...
    </p>
  `;

  try {

    const referencia = collection(db, COLECAO_ANIMAIS);

    const snapshot = await getDocs(referencia);

    animaisFirestore = [];

    snapshot.forEach((documento) => {

      const dados = documento.data();

      animaisFirestore.push({
        ...dados,

        // Guarda o ID REAL do documento Firestore
        firestoreId: documento.id,
      });

    });

    renderizarTudo();

  } catch (erro) {

    console.error("Erro ao carregar animais do Firestore:", erro);

    container.innerHTML = `
      <p class="sem-dados" style="color: #e57373;">
        Erro ao carregar os animais.
        Verifique sua conexão com o Firebase.
      </p>
    `;
  }
}


// ==========================================================
// ORGANIZAR ANIMAIS POR LOTE
// ==========================================================

function organizarPorLote() {

  const lotes = {};

  animaisFirestore.forEach((animal) => {

    const chaveLote = normalizarLote(animal.lote);

    if (!lotes[chaveLote]) {
      lotes[chaveLote] = [];
    }

    lotes[chaveLote].push(animal);
  });

  return lotes;
}


// ==========================================================
// RENDERIZAÇÃO GERAL
// ==========================================================

function renderizarTudo() {

  renderizarResumoGeral();

  renderizarLotes();
}


// ==========================================================
// RESUMO GERAL
// ==========================================================

function renderizarResumoGeral() {

  const resumoDiv = document.querySelector(".resumo-geral");

  if (!resumoDiv) return;

  const lotes = organizarPorLote();

  const totalAnimais = animaisFirestore.length;

  const pesoTotal = animaisFirestore.reduce(
    (acc, animal) => acc + (Number(animal.peso) || 0),
    0
  );

  const valorTotal = animaisFirestore.reduce(
    (acc, animal) => acc + (Number(animal.valor) || 0),
    0
  );

  const totalLotes = Object.keys(lotes).length;

  resumoDiv.innerHTML = `
    <div class="resumo-item">
      <strong>${totalLotes}</strong> lote(s)
    </div>

    <div class="resumo-item">
      <strong>${totalAnimais}</strong> animal(is)
    </div>

    <div class="resumo-item">
      <strong>${pesoTotal.toFixed(2)} kg</strong>
      peso total
    </div>

    <div class="resumo-item">
      <strong>R$ ${valorTotal.toFixed(2)}</strong>
      valor total investido
    </div>
  `;
}


// ==========================================================
// RENDERIZAR LOTES
// ==========================================================

function renderizarLotes() {

  const container = document.querySelector(".lotes-container");

  if (!container) return;

  container.innerHTML = "";

  const lotes = organizarPorLote();

  const chaves = ordenarChavesDeLotes(
    Object.keys(lotes)
  );

  if (chaves.length === 0) {

    container.innerHTML = `
      <p class="sem-dados">
        Nenhum lote cadastrado ainda.
        Salve uma contagem na página de Contagem para começar.
      </p>
    `;

    return;
  }


  chaves.forEach((chaveLote) => {

    const animais = lotes[chaveLote];

    if (!animais || animais.length === 0) return;


    // ======================================================
    // RESUMO DO LOTE
    // ======================================================

    const pesoTotal = animais.reduce(
      (acc, animal) =>
        acc + (Number(animal.peso) || 0),
      0
    );

    const pesoMedio =
      animais.length > 0
        ? pesoTotal / animais.length
        : 0;

    const valorTotal = animais.reduce(
      (acc, animal) =>
        acc + (Number(animal.valor) || 0),
      0
    );


    // ======================================================
    // SEÇÃO DO LOTE
    // ======================================================

    const secao = document.createElement("section");

    secao.className = "lote-section";


    // ======================================================
    // CABEÇALHO
    // ======================================================

    const header = document.createElement("div");

    header.className = "lote-header";

    header.innerHTML = `
      <div class="lote-titulo">

        <h2>Lote ${chaveLote}</h2>

        <button
          class="btn-remover-lote"
          data-lote="${chaveLote}"
        >
          Remover Lote
        </button>

      </div>

      <div class="lote-resumo">

        <span>
          ${animais.length} animal(is)
        </span>

        <span>
          Peso total: ${pesoTotal.toFixed(2)} kg
        </span>

        <span>
          Peso médio: ${pesoMedio.toFixed(2)} kg
        </span>

        <span>
          Valor total: R$ ${valorTotal.toFixed(2)}
        </span>

      </div>
    `;


    secao.appendChild(header);


    // ======================================================
    // CARDS DOS ANIMAIS
    // ======================================================

    const cardsDiv = document.createElement("div");

    cardsDiv.className = "lista-bois";


    animais.forEach((animal) => {

      const dataFormatada = animal.dataCompra
        ? new Date(
            animal.dataCompra + "T00:00:00"
          ).toLocaleDateString("pt-BR")
        : "--/--/----";


      const card = document.createElement("div");

      card.className = "card-animal";


      // Guarda o lote
      card.dataset.lote = chaveLote;


      // Guarda o ID REAL do Firestore
      card.dataset.firestoreId = animal.firestoreId;


      card.title =
        "Clique duas vezes para ver os detalhes do animal";


      card.innerHTML = `
        <div class="card-numero">
          <strong>Nº ${animal.numero}</strong>
        </div>

        <div class="card-info">

          ${animal.peso}kg

          <br>

          Compra: ${dataFormatada}

          <br>

          R$ ${(Number(animal.valor) || 0).toFixed(2)}

        </div>

        <div class="card-obs">

          Obs: ${animal.obs || "Nenhuma"}

        </div>

        <button
          class="btn-remover"
          data-firestore-id="${animal.firestoreId}"
          data-lote="${chaveLote}"
        >
          Remover
        </button>
      `;


      cardsDiv.appendChild(card);

    });


    secao.appendChild(cardsDiv);

    container.appendChild(secao);

  });
}


// ==========================================================
// REMOVER UM ANIMAL DO FIRESTORE
// ==========================================================

async function removerAnimalDoFirestore(firestoreId) {

  if (!firestoreId) return;


  const confirmar = confirm(
    "Tem certeza que deseja remover este animal?"
  );

  if (!confirmar) return;


  try {

    await deleteDoc(
      doc(db, COLECAO_ANIMAIS, firestoreId)
    );


    // Remove também da memória atual
    animaisFirestore = animaisFirestore.filter(
      (animal) =>
        animal.firestoreId !== firestoreId
    );


    renderizarTudo();


    alert(
      "Animal removido com sucesso!"
    );

  } catch (erro) {

    console.error(
      "Erro ao remover animal:",
      erro
    );

    alert(
      "Não foi possível remover o animal."
    );
  }
}


// ==========================================================
// REMOVER UM LOTE INTEIRO
// ==========================================================

async function removerLote(chaveLote) {

  const animaisDoLote =
    animaisFirestore.filter(
      (animal) =>
        normalizarLote(animal.lote) === chaveLote
    );


  if (animaisDoLote.length === 0) {
    return;
  }


  const confirmar = confirm(
    `Tem certeza que deseja remover o Lote ${chaveLote} e todos os seus ${animaisDoLote.length} animal(is)?`
  );


  if (!confirmar) return;


  try {

    // Exclui todos os documentos daquele lote
    await Promise.all(

      animaisDoLote.map((animal) =>
        deleteDoc(
          doc(
            db,
            COLECAO_ANIMAIS,
            animal.firestoreId
          )
        )
      )

    );


    // Atualiza a memória local
    animaisFirestore =
      animaisFirestore.filter(
        (animal) =>
          normalizarLote(animal.lote) !== chaveLote
      );


    renderizarTudo();


    alert(
      `Lote ${chaveLote} removido com sucesso!`
    );


  } catch (erro) {

    console.error(
      "Erro ao remover lote:",
      erro
    );

    alert(
      "Ocorreu um erro ao remover o lote."
    );
  }
}


// ==========================================================
// ABRIR DETALHES DO ANIMAL
// ==========================================================

function abrirDetalhesAnimal(
  chaveLote,
  firestoreId
) {

  const url =
    `/HTML/Animal.html?lote=${encodeURIComponent(
      chaveLote
    )}&id=${encodeURIComponent(
      firestoreId
    )}`;

  window.location.href = url;
}


// ==========================================================
// EVENTOS
// ==========================================================

function configurarEventos() {

  const container =
    document.querySelector(
      ".lotes-container"
    );


  if (!container) return;


  // ========================================================
  // CLIQUE
  // ========================================================

  container.addEventListener(
    "click",
    async (evento) => {

      const alvo = evento.target;


      // ----------------------------------------------
      // REMOVER ANIMAL
      // ----------------------------------------------

      if (
        alvo.classList.contains(
          "btn-remover"
        )
      ) {

        const firestoreId =
          alvo.dataset.firestoreId;


        await removerAnimalDoFirestore(
          firestoreId
        );

        return;
      }


      // ----------------------------------------------
      // REMOVER LOTE
      // ----------------------------------------------

      if (
        alvo.classList.contains(
          "btn-remover-lote"
        )
      ) {

        const chaveLote =
          alvo.dataset.lote;


        await removerLote(
          chaveLote
        );

        return;
      }

    }
  );


  // ========================================================
  // DUPLO CLIQUE
  // ========================================================

  container.addEventListener(
    "dblclick",
    (evento) => {

      // Se clicou no botão remover, não abre detalhes
      if (
        evento.target.classList.contains(
          "btn-remover"
        )
      ) {
        return;
      }


      const card =
        evento.target.closest(
          ".card-animal"
        );


      if (!card) return;


      const chaveLote =
        card.dataset.lote;


      const firestoreId =
        card.dataset.firestoreId;


      abrirDetalhesAnimal(
        chaveLote,
        firestoreId
      );

    }
  );

}


// ==========================================================
// INICIALIZAÇÃO
// ==========================================================

configurarEventos();

carregarAnimais();