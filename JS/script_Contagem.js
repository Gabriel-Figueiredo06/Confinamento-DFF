import { db } from "./Firebase.js";

import {
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// ==========================================================
// REBANHO DA CONTAGEM ATUAL
// ==========================================================

let rebanho = [];

// ==========================================================
// CHAVES DO LOCALSTORAGE
// ==========================================================

const CHAVE_LOTES = "confinamento_lotes_dados";
const CHAVE_CONTAGEM_ATUAL = "confinamento_carneiros_dados";

// ==========================================================
// ADICIONAR ANIMAL
// ==========================================================

function Adicionar_animal() {
  const pesoInput = document.getElementById("peso");
  const numInput = document.getElementById("num");
  const obsInput = document.getElementById("obs");

  const loteInput =
    document.getElementById("lote") ||
    document.querySelector('input[placeholder="Lote"]');

  const valorInput = document.getElementById("valor_animal");
  const dataCompraInput = document.getElementById("data_compra");

  const peso = parseFloat(pesoInput.value);
  const numero = numInput.value;
  const obs = obsInput.value;
  const lote = loteInput ? loteInput.value : "";

  const valor =
    valorInput && valorInput.value ? parseFloat(valorInput.value) : 0;

  const dataCompra = dataCompraInput.value;

  // ========================================================
  // VALIDAÇÕES
  // ========================================================

  if (!peso || !numero) {
    alert("Atenção: Peso e Número são obrigatórios!");
    return;
  }

  const animalDuplicado = rebanho.find(
    (carneiro) => carneiro.numero === numero && carneiro.lote === lote,
  );

  if (animalDuplicado) {
    alert(
      "Já existe um animal com este número no lote! Altere o número do animal",
    );

    return;
  }

  // ========================================================
  // CRIA O ANIMAL
  // ========================================================

  const novoCarneiro = {
    id: Date.now(),

    peso: peso,

    numero: numero,

    obs: obs,

    lote: lote,

    valor: valor,

    dataCompra: dataCompra,
  };

  // Adiciona somente na memória do navegador.
  // NÃO envia para o Firebase neste momento.

  rebanho.push(novoCarneiro);

  // ========================================================
  // LIMPA OS CAMPOS
  // ========================================================

  pesoInput.value = "";
  numInput.value = "";
  obsInput.value = "";
  dataCompraInput.value = "";

  if (loteInput) {
    loteInput.value = "";
  }

  if (valorInput) {
    valorInput.value = "";
  }

  pesoInput.focus();

  atualizarTela();
}

// ==========================================================
// ATUALIZAR TELA
// ==========================================================

function atualizarTela() {
  const listaDiv = document.querySelector(".lista-bois");
  const totalDiv = document.querySelector(".total_bois");
  const pesoTotDiv = document.querySelector(".peso_tot");

  if (!listaDiv || !totalDiv || !pesoTotDiv) {
    return;
  }

  listaDiv.innerHTML = "";

  let pesoTotal = 0;

  rebanho.forEach((carneiro) => {
    pesoTotal += carneiro.peso;

    const card = document.createElement("div");

    card.classList.add("card-animal");

    const dataFormatada = carneiro.dataCompra
      ? new Date(carneiro.dataCompra + "T00:00:00").toLocaleDateString("pt-BR")
      : "--/--/----";

    card.innerHTML = `

      <div class="card-numero">
        <strong>Nº ${carneiro.numero}</strong>
      </div>

      <div class="card-info">

        ${carneiro.peso}kg |
        Lote: ${carneiro.lote || "S/L"}

        <br>

        Compra: ${dataFormatada}

        <br>

        R$ ${carneiro.valor.toFixed(2)}

      </div>

      <div class="card-obs">

        Obs: ${carneiro.obs || "Nenhuma"}

      </div>

      <button
        class="btn-remover"
        onclick="removerAnimal(${carneiro.id})"
      >

        Remover

      </button>

    `;

    listaDiv.appendChild(card);
  });

  // ========================================================
  // RESUMO
  // ========================================================

  const pesoMedio = rebanho.length > 0 ? pesoTotal / rebanho.length : 0;

  totalDiv.innerHTML = `
    <h3>
      Total de animais: ${rebanho.length}
    </h3>
  `;

  pesoTotDiv.innerHTML = `

    <p>

      <strong>Peso total:</strong>
      ${pesoTotal.toFixed(2)} kg

      &nbsp;&nbsp;|&nbsp;&nbsp;

      <strong>Peso médio:</strong>
      ${pesoMedio.toFixed(2)} kg

    </p>

  `;

  // ========================================================
  // SALVA SOMENTE COMO RASCUNHO LOCAL
  // ========================================================
  //
  // ISSO NÃO É FIREBASE.
  //
  // Serve apenas para evitar que uma atualização da página
  // apague a contagem que ainda não foi salva.
  //

  localStorage.setItem(CHAVE_CONTAGEM_ATUAL, JSON.stringify(rebanho));
}

// ==========================================================
// REMOVER ANIMAL DA CONTAGEM
// ==========================================================

function removerAnimal(id) {
  rebanho = rebanho.filter((carneiro) => carneiro.id !== id);

  atualizarTela();
}

// ==========================================================
// CÁLCULO DO VALOR TOTAL
// ==========================================================

function CalculoValorTotal() {
  const precoKgInput = document.getElementById("valor_kg");

  const precoKg = parseFloat(precoKgInput.value);

  if (!precoKg || isNaN(precoKg)) {
    alert("Por favor, informe o Preço por Kg válido!");

    return;
  }

  const pesoTotal = rebanho.reduce((acc, curr) => acc + curr.peso, 0);

  const valorTotalEstimado = (pesoTotal * precoKg) / 2;

  const infoValorDiv =
    document.querySelector(".valor_total_receber") ||
    document.createElement("div");

  if (!document.querySelector(".valor_total_receber")) {
    infoValorDiv.className = "valor_total_receber";

    document.getElementById("info_valor").appendChild(infoValorDiv);
  }

  infoValorDiv.innerHTML = `

    <strong>
      Expectativa (Lote Todo):
    </strong>

    <br>

    R$ ${valorTotalEstimado.toFixed(2)}

  `;
}

// ==========================================================
// NORMALIZAÇÃO DO LOTE
// ==========================================================

function normalizarLote(lote) {
  const valor = (lote || "").toString().trim();

  return valor === "" ? "Sem Lote" : valor;
}

// ==========================================================
// SALVAR CONTAGEM
// ==========================================================
//
// AQUI acontece o envio para o FIREBASE.
//
// Adicionar_animal()
//      ↓
// somente memória/localStorage
//
// Salvar
//      ↓
// Firebase
//
// ==========================================================

async function salvarContagem() {
  if (rebanho.length === 0) {
    alert("Não há dados para salvar!");

    return;
  }

  // ========================================================
  // EVITA CLIQUES DUPLICADOS
  // ========================================================

  const botaoSalvar = document.querySelector(".salvar-contagem button");

  if (botaoSalvar) {
    botaoSalvar.disabled = true;

    botaoSalvar.textContent = "Salvando...";
  }

  try {
    // ======================================================
    // 1. SALVA CADA ANIMAL NO FIRESTORE
    // ======================================================

    for (const animal of rebanho) {
      await addDoc(collection(db, "animais"), {
        id: animal.id,

        peso: animal.peso,

        numero: animal.numero,

        obs: animal.obs,

        lote: normalizarLote(animal.lote),

        valor: animal.valor,

        dataCompra: animal.dataCompra,

        criadoEm: new Date().toISOString(),
      });
    }

    // ======================================================
    // 2. MANTÉM UMA CÓPIA LOCAL PARA O FUNCIONAMENTO
    //    ATUAL DAS OUTRAS PÁGINAS
    // ======================================================

    let lotesData = {};

    try {
      const dadosExistentes = localStorage.getItem(CHAVE_LOTES);

      lotesData = dadosExistentes ? JSON.parse(dadosExistentes) : {};
    } catch (e) {
      lotesData = {};
    }

    // ======================================================
    // 3. AGRUPA OS ANIMAIS POR LOTE
    // ======================================================

    rebanho.forEach((animal) => {
      const chaveLote = normalizarLote(animal.lote);

      if (!lotesData[chaveLote]) {
        lotesData[chaveLote] = [];
      }

      lotesData[chaveLote].push(animal);
    });

    // ======================================================
    // 4. ATUALIZA O LOCALSTORAGE
    // ======================================================

    localStorage.setItem(CHAVE_LOTES, JSON.stringify(lotesData));

    // ======================================================
    // 5. LIMPA A CONTAGEM ATUAL
    // ======================================================

    rebanho = [];

    localStorage.removeItem(CHAVE_CONTAGEM_ATUAL);

    // ======================================================
    // 6. LIMPA A TELA
    // ======================================================

    atualizarTela();

    const infoValorDiv = document.querySelector(".valor_total_receber");

    if (infoValorDiv) {
      infoValorDiv.innerHTML = "";
    }

    // ======================================================
    // 7. AVISA QUE DEU CERTO
    // ======================================================

    alert("Contagem salva com sucesso!");

    // ======================================================
    // 8. VAI PARA A PÁGINA DE ANIMAIS
    // ======================================================
    window.location.href = "Animais.html";
  } catch (erro) {
    console.error("Erro ao salvar no Firebase:", erro);

    alert(
      "Erro ao salvar os animais no Firebase.\n\n" +
        "Os dados NÃO foram apagados. " +
        "Verifique sua conexão e tente novamente.",
    );

    // ======================================================
    // IMPORTANTE:
    //
    // Se o Firebase falhar, NÃO limpamos o rebanho.
    // Assim o usuário pode tentar salvar novamente.
    // ======================================================

    if (botaoSalvar) {
      botaoSalvar.disabled = false;

      botaoSalvar.textContent = "Salvar";
    }
  }
}

// ==========================================================
// DISPONIBILIZA AS FUNÇÕES PARA O HTML
// ==========================================================

window.Adicionar_animal = Adicionar_animal;

window.CalculoValorTotal = CalculoValorTotal;

window.removerAnimal = removerAnimal;

window.salvarContagem = salvarContagem;

// ==========================================================
// RECUPERA UMA CONTAGEM NÃO SALVA
// ==========================================================

const dadosSalvos = localStorage.getItem(CHAVE_CONTAGEM_ATUAL);

if (dadosSalvos) {
  try {
    rebanho = JSON.parse(dadosSalvos);

    atualizarTela();
  } catch (e) {
    rebanho = [];
  }
}
