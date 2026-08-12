const CHAVE_LOTES = "confinamento_lotes_dados";
let lotes = {};

function carregarLotes() {
  let dados = {};
  
  try {
    const bruto = localStorage.getItem(CHAVE_LOTES);
    dados = bruto ? JSON.parse(bruto) : {};
  } catch (e) {
    dados = {};
  }
  
  lotes = dados;
  renderizarTudo();
}

function salvarLotesNoStorage() {
  localStorage.setItem(CHAVE_LOTES, JSON.stringify(lotes));
}

/**
Ordena as chaves dos lotes: numéricos em ordem crescente,
"Sem Lote" sempre por último.
*/
function ordenarChavesDeLotes(chaves) {
  return chaves.sort((a, b) => {
    if (a === "Sem Lote") return 1;
    if (b === "Sem Lote") return -1;
    
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    const aEhNumero = !isNaN(numA);
    const bEhNumero = !isNaN(numB);
    
    if (aEhNumero && bEhNumero) return numA - numB;
    if (aEhNumero) return -1;
    if (bEhNumero) return 1;
    
    return a.localeCompare(b);
  });
}

function renderizarTudo() {
  renderizarResumoGeral();
  renderizarLotes();
}

function renderizarResumoGeral() {
  const resumoDiv = document.querySelector(".resumo-geral");
  if (!resumoDiv) return;
  
  const todosAnimais = Object.values(lotes).flat();
  const totalAnimais = todosAnimais.length;
  const pesoTotal = todosAnimais.reduce((acc, a) => acc + (a.peso || 0), 0);
  const valorTotal = todosAnimais.reduce((acc, a) => acc + (a.valor || 0), 0);
  const totalLotes = Object.keys(lotes).length;
  
  resumoDiv.innerHTML = `<div class="resumo-item"><strong>${totalLotes}</strong> lote(s)</div> <div class="resumo-item"><strong>${totalAnimais}</strong> animal(is)</div> <div class="resumo-item"><strong>${pesoTotal.toFixed(2)} kg</strong> peso total</div> <div class="resumo-item"><strong>R$ ${valorTotal.toFixed(2)}</strong> valor total investido</div>`;
}

function renderizarLotes() {
  const container = document.querySelector(".lotes-container");
  container.innerHTML = "";
  
  const chaves = ordenarChavesDeLotes(Object.keys(lotes));
  
  if (chaves.length === 0) {
    container.innerHTML = `<p class="sem-dados">Nenhum lote cadastrado ainda. Salve uma contagem na página de Contagem para começar.</p>`;
    return;
  }
  
  chaves.forEach((chaveLote) => {
    const animais = lotes[chaveLote];
    if (!animais || animais.length === 0) return;
    
    const pesoTotal = animais.reduce((acc, a) => acc + (a.peso || 0), 0);
    const pesoMedio = animais.length > 0 ? pesoTotal / animais.length : 0;
    const valorTotal = animais.reduce((acc, a) => acc + (a.valor || 0), 0);
    
    const secao = document.createElement("section");
    secao.className = "lote-section";
    
    const header = document.createElement("div");
    header.className = "lote-header";
    header.innerHTML = `
      <div class="lote-titulo">
        <h2>Lote ${chaveLote}</h2>
        <button class="btn-remover-lote" data-lote="${chaveLote}">Remover Lote</button>
      </div>
      <div class="lote-resumo">
        <span>${animais.length} animal(is)</span>
        <span>Peso total: ${pesoTotal.toFixed(2)} kg</span>
        <span>Peso médio: ${pesoMedio.toFixed(2)} kg</span>
        <span>Valor total: R$ ${valorTotal.toFixed(2)}</span>
      </div>
    `;
    secao.appendChild(header);

    const cardsDiv = document.createElement("div");
    cardsDiv.className = "lista-bois";

    animais.forEach((animal) => {
      const dataFormatada = animal.dataCompra
        ? new Date(animal.dataCompra + "T00:00:00").toLocaleDateString("pt-BR")
        : "--/--/----";

      const card = document.createElement("div");
      card.className = "card-animal";
      // Guardamos lote e id no próprio card para o duplo-clique saber qual animal abrir
      card.dataset.lote = chaveLote;
      card.dataset.id = animal.id;
      card.title = "Clique duas vezes para ver os detalhes do animal";

      card.innerHTML = `
        <div class="card-numero"><strong>Nº ${animal.numero}</strong></div>
        <div class="card-info">
          ${animal.peso}kg
          <br>
          Compra: ${dataFormatada}
          <br>
          R$ ${(animal.valor || 0).toFixed(2)}
        </div>
        <div class="card-obs">Obs: ${animal.obs || "Nenhuma"}</div>
        <button class="btn-remover" data-lote="${chaveLote}" data-id="${animal.id}">Remover</button>
      `;
      cardsDiv.appendChild(card);
    });

    secao.appendChild(cardsDiv);
    container.appendChild(secao);
  });
}

function removerAnimalDoLote(chaveLote, id) {
  if (!lotes[chaveLote]) return;
  lotes[chaveLote] = lotes[chaveLote].filter((a) => a.id !== id);
  
  if (lotes[chaveLote].length === 0) {
    delete lotes[chaveLote];
  }
  
  salvarLotesNoStorage();
  renderizarTudo();
}

function removerLote(chaveLote) {
  const confirmar = confirm(`Tem certeza que deseja remover o Lote ${chaveLote} e todos os seus animais?`);
  
  if (!confirmar) return;
  
  delete lotes[chaveLote];
  salvarLotesNoStorage();
  renderizarTudo();
}

/**
Abre a página de detalhes do animal específico, levando
o lote e o id como parâmetros na URL.
*/
function abrirDetalhesAnimal(chaveLote, id) {
  const url = `/HTML/Animal.html?lote=${encodeURIComponent(chaveLote)}&id=${encodeURIComponent(id)}`;
  window.location.href = url;
}

// Delegação de eventos: os botões/cards são criados dinamicamente
function configurarEventos() {
  const container = document.querySelector(".lotes-container");
  
  // Clique simples: remover animal ou remover lote
  container.addEventListener("click", (evento) => {
    const alvo = evento.target;
    
    if (alvo.classList.contains("btn-remover")) {
      const chaveLote = alvo.dataset.lote;
      const id = Number(alvo.dataset.id);
      removerAnimalDoLote(chaveLote, id);
    }

    if (alvo.classList.contains("btn-remover-lote")) {
      const chaveLote = alvo.dataset.lote;
      removerLote(chaveLote);
    }
  });
  
  // Duplo clique: abrir a página de detalhes do animal
  container.addEventListener("dblclick", (evento) => {
    // Ignora se o duplo clique foi em cima do botão de remover
    if (evento.target.classList.contains("btn-remover")) return;
    
    const card = evento.target.closest(".card-animal");
    if (!card) return;

    const chaveLote = card.dataset.lote;
    const id = card.dataset.id;
    abrirDetalhesAnimal(chaveLote, id);
  });
}

// Inicialização Direta (Sem depender do window.onload instável em módulos)
configurarEventos();
carregarLotes();