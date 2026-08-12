let rebanho = [];

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

  const novoCarneiro = {
    id: Date.now(),
    peso: peso,
    numero: numero,
    obs: obs,
    lote: lote,
    valor: valor,
    dataCompra: dataCompra,
  };

  rebanho.push(novoCarneiro);

  pesoInput.value = "";
  numInput.value = "";
  obsInput.value = "";
  dataCompraInput.value = "";
  if (loteInput) loteInput.value = "";
  if (valorInput) valorInput.value = "";
  
  pesoInput.focus();
  atualizarTela();
}

function atualizarTela() {
  const listaDiv = document.querySelector(".lista-bois");
  const totalDiv = document.querySelector(".total_bois");
  const pesoTotDiv = document.querySelector(".peso_tot");
  
  listaDiv.innerHTML = "";
  let pesoTotal = 0;
  
  rebanho.forEach((carneiro) => {
    pesoTotal += carneiro.peso;
    const card = document.createElement("div");
    
    // Agora aplicamos apenas a classe definida no CSS
    card.classList.add("card-animal");

    const dataFormatada = carneiro.dataCompra
      ? new Date(carneiro.dataCompra + "T00:00:00").toLocaleDateString("pt-BR")
      : "--/--/----";

    card.innerHTML = `
      <div class="card-numero"><strong>Nº ${carneiro.numero}</strong></div>

      <div class="card-info">
          ${carneiro.peso}kg | Lote: ${carneiro.lote || "S/L"}
          <br>
          Compra: ${dataFormatada}
          <br>
          R$ ${carneiro.valor.toFixed(2)}
      </div>

      <div class="card-obs">
          Obs: ${carneiro.obs || "Nenhuma"}
      </div>

      <button class="btn-remover" onclick="removerAnimal(${carneiro.id})">
          Remover
      </button>
    `;

    listaDiv.appendChild(card);
  });
  
  const pesoMedio = rebanho.length > 0 ? pesoTotal / rebanho.length : 0;
  
  totalDiv.innerHTML = `<h3>Total de animais: ${rebanho.length}</h3>`;
  pesoTotDiv.innerHTML = `<p><strong>Peso total:</strong> ${pesoTotal.toFixed(2)} kg &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Peso médio:</strong> ${pesoMedio.toFixed(2)} kg</p>`;

  // MELHORIA: Salva o estado atual do rebanho na memória para não perder dados se recarregar a página antes de "Salvar"
  localStorage.setItem(CHAVE_CONTAGEM_ATUAL, JSON.stringify(rebanho));
}

function removerAnimal(id) {
  rebanho = rebanho.filter((carneiro) => carneiro.id !== id);
  atualizarTela();
}

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
  
  infoValorDiv.innerHTML = `<strong>Expectativa (Lote Todo):</strong><br>R$ ${valorTotalEstimado.toFixed(2)}`;
}

// ==========================================================
// CHAVE COMPARTILHADA COM A PÁGINA DE ANIMAIS
// ==========================================================
const CHAVE_LOTES = "confinamento_lotes_dados";
const CHAVE_CONTAGEM_ATUAL = "confinamento_carneiros_dados";

/**
Normaliza o identificador do lote para evitar que "1", " 1" e "1 "
sejam tratados como lotes diferentes.
*/
function normalizarLote(lote) {
  const valor = (lote || "").toString().trim();
  return valor === "" ? "Sem Lote" : valor;
}

/**
Salva a contagem atual, distribuindo automaticamente os animais
entre os lotes já existentes na página de Animais (mesclando) ou
criando novos lotes quando necessário.
*/
function salvarContagem() {

if (rebanho.length === 0) {

alert("Não há dados para salvar!");

return;

}

// 1. Carrega os lotes que já existem
let lotesData = {};

try {

const dadosExistentes = localStorage.getItem(CHAVE_LOTES);

lotesData = dadosExistentes ? JSON.parse(dadosExistentes) : {};

} catch (e) {

lotesData = {};

}

// 2. Agrupa os animais da contagem atual por lote
rebanho.forEach((animal) => {

const chaveLote = normalizarLote(animal.lote);

if (!lotesData[chaveLote]) {

lotesData[chaveLote] = [];

}

lotesData[chaveLote].push(animal);

});

// 3. Salva os lotes no localStorage
localStorage.setItem(CHAVE_LOTES, JSON.stringify(lotesData));

// 4. Limpa a contagem atual
rebanho = [];

localStorage.removeItem(CHAVE_CONTAGEM_ATUAL);

// 5. Limpa a tela
atualizarTela();

const infoValorDiv = document.querySelector(".valor_total_receber");

if (infoValorDiv) infoValorDiv.innerHTML = "";

// 6. Vai automaticamente para a página de Animais
window.location.href = "/HTML/Animais.html";

}

window.Adicionar_animal = Adicionar_animal;
window.CalculoValorTotal = CalculoValorTotal;
window.removerAnimal = removerAnimal;
window.salvarContagem = salvarContagem;

// Inicialização Direta (Sem depender do window.onload)
const dadosSalvos = localStorage.getItem(CHAVE_CONTAGEM_ATUAL);
if (dadosSalvos) {
  try {
    rebanho = JSON.parse(dadosSalvos);
    atualizarTela();
  } catch(e) {
    rebanho = [];
  }
}