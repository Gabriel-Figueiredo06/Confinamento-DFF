const CHAVE_LOTES = "confinamento_lotes_dados";
const CHAVE_VENDIDOS = "confinamento_animais_vendidos";

let loteAtual = null;
let idAtual = null;

function obterParametrosDaUrl() {
  const params = new URLSearchParams(window.location.search);
  const loteParam = params.get("lote");
  const idParam = params.get("id");

  return {
    lote: loteParam,
    id: idParam ? Number(idParam) : null,
  };
}

function carregarLotesDoStorage() {
  try {
    const bruto = localStorage.getItem(CHAVE_LOTES);
    return bruto ? JSON.parse(bruto) : {};
  } catch (e) {
    return {};
  }
}

function salvarLotesNoStorage(lotes) {
  localStorage.setItem(CHAVE_LOTES, JSON.stringify(lotes));
}

function gerarId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function buscarAnimal(lotes, lote, id) {
  const animais = lotes[lote] || [];
  return animais.find((a) => a.id === id) || null;
}

function garantirArraysDoAnimal(animal) {
  if (!animal.remedios) animal.remedios = [];
  if (!animal.gastos) animal.gastos = [];
  if (!animal.pesos) animal.pesos = [];
}

function atualizarAnimal(funcaoDeAtualizacao) {
  const lotes = carregarLotesDoStorage();
  const animal = buscarAnimal(lotes, loteAtual, idAtual);
  if (!animal) return;

  garantirArraysDoAnimal(animal);
  funcaoDeAtualizacao(animal);

  salvarLotesNoStorage(lotes);
  renderizarFichaAnimal(
    document.querySelector(".detalhe-container"),
    animal,
    loteAtual,
  );
}

function carregarAnimal() {
  const container = document.querySelector(".detalhe-container");
  const { lote, id } = obterParametrosDaUrl();

  if (!lote || !id) {
    exibirErro(
      container,
      "Não foi possível identificar o animal (parâmetros inválidos na URL).",
    );
    return;
  }

  loteAtual = lote;
  idAtual = id;

  const lotes = carregarLotesDoStorage();
  const animal = buscarAnimal(lotes, lote, id);

  if (!animal) {
    exibirErro(container, "Animal não encontrado. Ele pode ter sido removido ou vendido.");
    return;
  }

  garantirArraysDoAnimal(animal);
  salvarLotesNoStorage(lotes);

  renderizarFichaAnimal(container, animal, lote);
  configurarEventosContainer();
}

function exibirErro(container, mensagem) {
  container.innerHTML = `<p class="erro">${mensagem}</p>`;
}

/* ==========================================================
   FICHA PRINCIPAL E VENDAS
   ========================================================== */

function renderizarFichaAnimal(container, animal, lote) {
  garantirArraysDoAnimal(animal);

  const dataFormatada = animal.dataCompra
    ? new Date(animal.dataCompra + "T00:00:00").toLocaleDateString("pt-BR")
    : "--/--/----";

  container.innerHTML = `
    <div class="ficha-animal">
      <div class="ficha-header">
        <h2>Nº ${animal.numero}</h2>
        <span class="ficha-lote">Lote ${lote}</span>
      </div>

      <div class="ficha-dados">
        <div class="dado">
          <span class="dado-label">Peso Inicial</span>
          <span class="dado-valor">${animal.peso} kg</span>
        </div>
        <div class="dado">
          <span class="dado-label" id="data-compra-label">Data de compra</span>
          <span class="dado-valor" id="data-compra">${dataFormatada}</span>
        </div>
        <div class="dado">
          <span class="dado-label">Valor de compra</span>
          <span class="dado-valor">R$ ${(animal.valor || 0).toFixed(2)}</span>
        </div>
        <div class="dado dado-obs">
          <span class="dado-label">Observação</span>
          <span class="dado-valor">${animal.obs || "Nenhuma"}</span>
        </div>
        
        <button id="sold-btn" class="btn-vender" onclick="venderBoi()">Marcar como Vendido</button>
      </div>
    </div>

    <div class="secao-extra" id="secao-remedios">
      <h3>Remédios / Vacinas</h3>
      <form id="form-remedio" class="form-inline">
        <input type="date" id="input-data-remedio" required />
        <input type="text" id="input-nome-remedio" placeholder="Medicação" required />
        <button type="submit">Agendar</button>
      </form>
      <div class="lista-itens" id="lista-remedios"></div>
    </div>

    <div class="secao-extra" id="secao-gastos">
      <h3>Gastos do Animal</h3>
      <form id="form-gasto" class="form-inline">
        <input type="text" id="input-descricao-gasto" placeholder="Com o que foi o gasto" required />
        <input type="number" id="input-valor-gasto" placeholder="Valor (R$)" min="0" step="0.01" required />
        <button type="submit">Adicionar</button>
      </form>
      <div class="lista-itens" id="lista-gastos"></div>
      <div class="total-gastos" id="total-gastos"></div>
    </div>

    <div class="secao-extra" id="secao-pesos">
      <h3>Histórico de Peso</h3>
      <form id="form-peso" class="form-inline">
        <input type="date" id="input-data-peso" required />
        <input type="number" id="input-valor-peso" placeholder="Peso (kg)" min="0" step="0.1" required />
        <button type="submit">Registrar</button>
      </form>
      <div class="lista-itens" id="lista-pesos"></div>
    </div>
  `;

  renderizarRemedios(animal);
  renderizarGastos(animal);
  renderizarPesos(animal);
  configurarFormularios();
}

function venderBoi() {
  const confirmar = confirm("Confirme que este animal foi vendido. Ele sairá do lote e irá para o histórico de vendas.");
  if (!confirmar) return;

  const lotes = carregarLotesDoStorage();
  const animal = buscarAnimal(lotes, loteAtual, idAtual);

  if (!animal) {
    alert("Erro: Animal não encontrado.");
    return;
  }

  let vendidos = [];
  try {
    const bruto = localStorage.getItem(CHAVE_VENDIDOS);
    if (bruto) vendidos = JSON.parse(bruto);
  } catch (e) {}

  animal.dataVenda = new Date().toISOString().split("T")[0];
  vendidos.push(animal);
  localStorage.setItem(CHAVE_VENDIDOS, JSON.stringify(vendidos));

  lotes[loteAtual] = lotes[loteAtual].filter((a) => a.id !== idAtual);
  
  if (lotes[loteAtual].length === 0) {
    delete lotes[loteAtual];
  }
  
  salvarLotesNoStorage(lotes);

  alert("Animal marcado como VENDIDO com sucesso!");
  window.location.href = "/HTML/Vendidos.html"; 
}

/* ==========================================================
   RENDERIZAÇÕES DE ITENS E CÁLCULO GMD
   ========================================================== */

function renderizarRemedios(animal) {
  const lista = document.getElementById("lista-remedios");
  if (!lista) return;

  const remediosOrdenados = [...animal.remedios].sort((a, b) => new Date(a.data) - new Date(b.data));

  if (remediosOrdenados.length === 0) {
    lista.innerHTML = `<p class="lista-vazia">Nenhum remédio ou vacina agendado.</p>`;
    return;
  }

  lista.innerHTML = remediosOrdenados
    .map((r) => {
      const dataFormatada = new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR");
      return `
        <div class="item-linha ${r.aplicado ? "item-concluido" : ""}">
          <label class="item-checkbox">
            <input type="checkbox" data-tipo="remedio" data-id="${r.id}" ${r.aplicado ? "checked" : ""} />
            <span>${dataFormatada} • ${r.nome}</span>
          </label>
          <button class="btn-remover-item" data-tipo="remedio" data-id="${r.id}">×</button>
        </div>
      `;
    })
    .join("");
}

function renderizarGastos(animal) {
  const lista = document.getElementById("lista-gastos");
  const totalDiv = document.getElementById("total-gastos");
  if (!lista) return;

  if (animal.gastos.length === 0) {
    lista.innerHTML = `<p class="lista-vazia">Nenhum gasto registrado.</p>`;
    totalDiv.innerHTML = "";
    return;
  }

  lista.innerHTML = animal.gastos
    .map((g) => `
        <div class="item-linha">
          <span>${g.descricao} — R$ ${g.valor.toFixed(2)}</span>
          <button class="btn-remover-item" data-tipo="gasto" data-id="${g.id}">×</button>
        </div>
      `)
    .join("");

  const total = animal.gastos.reduce((acc, g) => acc + g.valor, 0);
  totalDiv.innerHTML = `<strong>Total gasto:</strong> R$ ${total.toFixed(2)}`;
}

function renderizarPesos(animal) {
  const lista = document.getElementById("lista-pesos");
  if (!lista) return;

  const pesosOrdenados = [...animal.pesos].sort((a, b) => new Date(a.data) - new Date(b.data));

  if (pesosOrdenados.length === 0) {
    lista.innerHTML = `<p class="lista-vazia">Nenhum registro de peso ainda.</p>`;
    return;
  }

  let pesoAnterior = animal.peso;
  let dataAnterior = animal.dataCompra ? new Date(animal.dataCompra + "T00:00:00") : null;

  lista.innerHTML = pesosOrdenados
    .map((p) => {
      const dataAtual = new Date(p.data + "T00:00:00");
      const dataFormatada = dataAtual.toLocaleDateString("pt-BR");

      let gmdText = "---";

      if (dataAnterior) {
        const diferencaTempo = Math.abs(dataAtual - dataAnterior);
        const diasPassados = Math.round(diferencaTempo / (1000 * 60 * 60 * 24));

        if (diasPassados > 0) {
          const gmd = (p.peso - pesoAnterior) / diasPassados;
          gmdText = `${gmd.toFixed(3)} kg/dia`;
        } else if (diasPassados === 0) {
          gmdText = "Mesmo dia";
        }
      } else {
        gmdText = "S/ Data Inic.";
      }

      pesoAnterior = p.peso;
      dataAnterior = dataAtual;

      return `
        <div class="item-linha">
          <span>
            ${dataFormatada} — ${p.peso} kg 
            <span style="color: #8eb69b; font-size: 0.85em; margin-left: 10px;">(GMD: ${gmdText})</span>
          </span>
          <button class="btn-remover-item" data-tipo="peso" data-id="${p.id}">×</button>
        </div>
      `;
    })
    .join("");
}

function configurarFormularios() {
  const formRemedio = document.getElementById("form-remedio");
  const formGasto = document.getElementById("form-gasto");
  const formPeso = document.getElementById("form-peso");

  formRemedio.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const data = document.getElementById("input-data-remedio").value;
    const nome = document.getElementById("input-nome-remedio").value.trim();

    if (!data || !nome) return;

    atualizarAnimal((animal) => {
      animal.remedios.push({ id: gerarId(), data: data, nome: nome, aplicado: false });
    });
  });

  formGasto.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const descricao = document.getElementById("input-descricao-gasto").value.trim();
    const valor = parseFloat(document.getElementById("input-valor-gasto").value);

    if (!descricao || !valor || isNaN(valor)) return;

    atualizarAnimal((animal) => {
      animal.gastos.push({ id: gerarId(), descricao: descricao, valor: valor });
    });
  });

  formPeso.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const data = document.getElementById("input-data-peso").value;
    const peso = parseFloat(document.getElementById("input-valor-peso").value);

    if (!data || !peso || isNaN(peso)) return;

    atualizarAnimal((animal) => {
      animal.pesos.push({ id: gerarId(), data: data, peso: peso });
    });
  });
}

function configurarEventosContainer() {
  const container = document.querySelector(".detalhe-container");

  container.addEventListener("change", (evento) => {
    const alvo = evento.target;
    if (alvo.matches('input[type="checkbox"][data-tipo="remedio"]')) {
      const id = Number(alvo.dataset.id);
      atualizarAnimal((animal) => {
        const remedio = animal.remedios.find((r) => r.id === id);
        if (remedio) remedio.aplicado = alvo.checked;
      });
    }
  });

  container.addEventListener("click", (evento) => {
    const alvo = evento.target;
    if (!alvo.classList.contains("btn-remover-item")) return;

    const tipo = alvo.dataset.tipo;
    const id = Number(alvo.dataset.id);

    atualizarAnimal((animal) => {
      if (tipo === "remedio") {
        animal.remedios = animal.remedios.filter((r) => r.id !== id);
      } else if (tipo === "gasto") {
        animal.gastos = animal.gastos.filter((g) => g.id !== id);
      } else if (tipo === "peso") {
        animal.pesos = animal.pesos.filter((p) => p.id !== id);
      }
    });
  });
}

window.venderBoi = venderBoi;
window.onload = carregarAnimal;