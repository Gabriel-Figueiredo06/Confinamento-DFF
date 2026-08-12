import { db } from "./Firebase.js";

import {
  collection,
  getDocs,
  doc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const COLECAO_VENDIDOS = "vendidos";

// ==========================================================
// ESCAPAR HTML
// ==========================================================

function escaparHTML(valor) {
  if (valor === null || valor === undefined) {
    return "";
  }

  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ==========================================================
// FORMATAR DATA
// ==========================================================

function formatarData(data) {
  if (!data) {
    return "--/--/----";
  }

  try {
    // Caso seja Timestamp do Firebase
    if (typeof data.toDate === "function") {
      return data.toDate().toLocaleDateString("pt-BR");
    }

    // Caso seja string YYYY-MM-DD
    if (typeof data === "string") {
      return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
    }

    // Caso seja Date
    if (data instanceof Date) {
      return data.toLocaleDateString("pt-BR");
    }

    return "--/--/----";
  } catch (erro) {
    return "--/--/----";
  }
}

// ==========================================================
// CARREGAR VENDIDOS DO FIREBASE
// ==========================================================

async function carregarVendidos() {
  const container = document.querySelector(".container-animais-vendidos");

  const resumoDiv = document.getElementById("resumo-vendas");

  if (!container) {
    console.error("Container .container-animais-vendidos não encontrado.");
    return;
  }

  container.innerHTML = `
        <p class="carregando">
            Carregando histórico de animais vendidos...
        </p>
    `;

  try {
    const snapshot = await getDocs(collection(db, COLECAO_VENDIDOS));

    let vendidos = [];

    snapshot.forEach((documento) => {
      const dados = documento.data();

      vendidos.push({
        ...dados,
        _firebaseId: documento.id,
      });
    });

    // ==================================================
    // NENHUM VENDIDO
    // ==================================================

    if (vendidos.length === 0) {
      container.innerHTML = `
                <p
                    class="sem-dados"
                    style="color: #8eb69b;"
                >
                    Nenhum animal foi vendido ainda.
                    O seu histórico está vazio.
                </p>
            `;

      if (resumoDiv) {
        resumoDiv.style.display = "none";
      }

      return;
    }

    // ==================================================
    // ORDENAR MAIS RECENTES PRIMEIRO
    // ==================================================

    vendidos.sort((a, b) => {
      const dataA = obterDataOrdenacao(a.dataVenda);

      const dataB = obterDataOrdenacao(b.dataVenda);

      return dataB - dataA;
    });

    // ==================================================
    // RESUMO
    // ==================================================

    const totalAnimaisVendidos = vendidos.length;

    let totalInvestido = 0;

    vendidos.forEach((animal) => {
      const gastos = Array.isArray(animal.gastos) ? animal.gastos : [];

      const totalGastos = gastos.reduce(
        (acc, gasto) => acc + Number(gasto.valor || 0),
        0,
      );

      const custoTotal = Number(animal.valor || 0) + totalGastos;

      totalInvestido += custoTotal;
    });

    if (resumoDiv) {
      resumoDiv.style.display = "flex";

      resumoDiv.innerHTML = `
                <div class="resumo-item">
                    <strong>
                        ${totalAnimaisVendidos}
                    </strong>
                    animal(is) vendido(s)
                </div>

                <div class="resumo-item">
                    <strong>
                        R$ ${totalInvestido.toFixed(2)}
                    </strong>
                    custo total acumulado neles
                </div>
            `;
    }

    // ==================================================
    // MONTAR CARDS
    // ==================================================

    let htmlCards = `
            <div class="lista-bois">
        `;

    vendidos.forEach((animal) => {
      htmlCards += criarCardVendido(animal);
    });

    htmlCards += `
            </div>
        `;

    container.innerHTML = htmlCards;

    configurarEventos();
  } catch (erro) {
    console.error("Erro ao carregar vendidos do Firebase:", erro);

    container.innerHTML = `
            <p
                class="erro"
                style="color: #e57373;"
            >
                Não foi possível carregar o histórico
                de animais vendidos.
            </p>
        `;
  }
}

// ==========================================================
// DATA PARA ORDENAÇÃO
// ==========================================================

function obterDataOrdenacao(data) {
  try {
    if (!data) {
      return 0;
    }

    if (typeof data.toDate === "function") {
      return data.toDate().getTime();
    }

    if (typeof data === "string") {
      return new Date(data + "T00:00:00").getTime();
    }

    if (data instanceof Date) {
      return data.getTime();
    }

    return 0;
  } catch (erro) {
    return 0;
  }
}

// ==========================================================
// CRIAR CARD DO ANIMAL VENDIDO
// ==========================================================

function criarCardVendido(animal) {
  // ======================================================
  // DADOS BÁSICOS
  // ======================================================

  const numero = escaparHTML(animal.numero ?? "--");

  const lote = escaparHTML(animal.lote || "S/L");

  const dataCompra = formatarData(animal.dataCompra);

  const dataVenda = formatarData(animal.dataVenda);

  const pesoInicial = Number(animal.peso || 0);

  const valorAnimal = Number(animal.valor || 0);

  // ======================================================
  // ARRAYS
  // ======================================================

  const gastosSeguros = Array.isArray(animal.gastos) ? animal.gastos : [];

  const pesosSeguros = Array.isArray(animal.pesos) ? animal.pesos : [];

  const remediosSeguros = Array.isArray(animal.remedios) ? animal.remedios : [];

  // ======================================================
  // TOTAL DE GASTOS
  // ======================================================

  const totalGastos = gastosSeguros.reduce(
    (acc, gasto) => acc + Number(gasto.valor || 0),
    0,
  );

  const custoTotal = valorAnimal + totalGastos;

  // ======================================================
  // HISTÓRICO DE PESOS
  // ======================================================

  let pesosHTML = `
        <div
            style="
                background-color: rgba(0, 0, 0, 0.15);
                padding: 10px;
                border-radius: 8px;
                margin: 10px 0;
                border: 1px solid #163832;
            "
        >

            <h4
                style="
                    color: #8eb69b;
                    margin-top: 0;
                    margin-bottom: 8px;
                    font-size: 1em;
                    border-bottom: 1px dashed #163832;
                    padding-bottom: 4px;
                "
            >
                Histórico de Pesagem
            </h4>

            <div
                style="
                    font-size: 0.9em;
                    margin-bottom: 4px;
                "
            >
                ${dataCompra}:

                <strong>
                    ${pesoInicial.toFixed(2)} kg
                </strong>

                <span
                    style="
                        color: #8eb69b;
                        font-size: 0.9em;
                    "
                >
                    (Inicial)
                </span>
            </div>
    `;

  if (pesosSeguros.length > 0) {
    const pesosOrdenados = [...pesosSeguros].sort(
      (a, b) => obterDataOrdenacao(a.data) - obterDataOrdenacao(b.data),
    );

    let pesoAnterior = pesoInicial;

    let dataAnterior = animal.dataCompra
      ? new Date(animal.dataCompra + "T00:00:00")
      : null;

    pesosHTML += pesosOrdenados
      .map((pesoRegistro) => {
        const pesoAtual = Number(pesoRegistro.peso || 0);

        const dataAtual = converterDataParaDate(pesoRegistro.data);

        const dataFormatada = formatarData(pesoRegistro.data);

        let gmdText = "---";

        if (dataAnterior && dataAtual) {
          const diferencaTempo = Math.abs(dataAtual - dataAnterior);

          const diasPassados = Math.round(
            diferencaTempo / (1000 * 60 * 60 * 24),
          );

          if (diasPassados > 0) {
            const gmd = (pesoAtual - pesoAnterior) / diasPassados;

            gmdText = `${gmd.toFixed(3)} kg/dia`;
          } else {
            gmdText = "Mesmo dia";
          }
        } else {
          gmdText = "S/ Data Inic.";
        }

        pesoAnterior = pesoAtual;

        dataAnterior = dataAtual;

        return `
                        <div
                            style="
                                font-size: 0.9em;
                                margin-bottom: 4px;
                            "
                        >

                            ${dataFormatada}:

                            <strong>
                                ${pesoAtual.toFixed(2)} kg
                            </strong>

                            <span
                                style="
                                    color: #8eb69b;
                                    font-size: 0.9em;
                                "
                            >
                                (GMD:
                                ${gmdText})
                            </span>

                        </div>
                    `;
      })
      .join("");
  }

  pesosHTML += `
        </div>
    `;

  // ======================================================
  // HISTÓRICO DE GASTOS
  // ======================================================

  let gastosHTML = "";

  if (gastosSeguros.length > 0) {
    gastosHTML = gastosSeguros
      .map((gasto) => {
        const descricao = escaparHTML(gasto.descricao || "Gasto");

        const valor = Number(gasto.valor || 0);

        return `
                        <li>
                            ${descricao}:

                            <strong>
                                R$ ${valor.toFixed(2)}
                            </strong>
                        </li>
                    `;
      })
      .join("");
  } else {
    gastosHTML = `
            <li>
                <em>
                    Nenhum gasto extra registrado
                </em>
            </li>
        `;
  }

  // ======================================================
  // HISTÓRICO DE REMÉDIOS
  // ======================================================

  let remediosHTML = "";

  if (remediosSeguros.length > 0) {
    remediosHTML = remediosSeguros
      .map((remedio) => {
        const data = formatarData(remedio.data);

        const nome = escaparHTML(remedio.nome || "Medicação");

        const status = remedio.aplicado
          ? `
                                <span
                                    style="
                                        color: #8eb69b;
                                    "
                                >
                                    (Aplicado)
                                </span>
                            `
          : `
                                <span
                                    style="
                                        color: #e57373;
                                    "
                                >
                                    (Pendente)
                                </span>
                            `;

        return `
                        <li>
                            ${data}
                            -
                            ${nome}
                            ${status}
                        </li>
                    `;
      })
      .join("");
  } else {
    remediosHTML = `
            <li>
                <em>
                    Nenhum remédio registrado
                </em>
            </li>
        `;
  }

  // ======================================================
  // OBSERVAÇÃO
  // ======================================================

  const observacao = escaparHTML(
    animal.obs || "Nenhuma observação registrada na entrada.",
  );

  // ======================================================
  // CARD
  // ======================================================

  return `
        <div
            class="card-animal card-vendido"
            data-id="${animal._firebaseId}"
        >

            <div
                class="card-numero"
                style="color: #8eb69b;"
            >

                <strong>
                    Nº ${numero}
                </strong>

                <span
                    style="
                        font-size: 0.7em;
                        color: #ccc;
                    "
                >
                    (Lote: ${lote})
                </span>

            </div>


            <div
                class="card-info"
                style="
                    line-height: 1.5;
                    margin-top: 10px;
                "
            >

                <strong>
                    Compra:
                </strong>

                ${dataCompra}

                <br>


                <strong>
                    Venda:
                </strong>

                <span
                    style="
                        color: #8eb69b;
                    "
                >
                    ${dataVenda}
                </span>

                <br>


                ${pesosHTML}


                <hr
                    class="linha-divisoria"
                >


                <strong>
                    Custo Total:
                </strong>

                R$
                ${custoTotal.toFixed(2)}

                <br>


                <span
                    style="
                        font-size: 0.8em;
                        color: #aaa;
                    "
                >
                    (Valor animal
                    R$ ${valorAnimal.toFixed(2)}
                    +
                    Gastos
                    R$ ${totalGastos.toFixed(2)})
                </span>

            </div>


            <details
                class="detalhes-historico"
            >

                <summary>
                    Ver Gastos, Remédios e Obs
                </summary>


                <div
                    class="historico-conteudo"
                >

                    <h4>
                        Gastos Realizados
                    </h4>

                    <ul>
                        ${gastosHTML}
                    </ul>


                    <h4>
                        Remédios / Vacinas
                    </h4>

                    <ul>
                        ${remediosHTML}
                    </ul>


                    <h4>
                        Observação Inicial
                    </h4>

                    <p>
                        ${observacao}
                    </p>

                </div>

            </details>


            <button
                class="btn-remover btn-excluir-vendido"
                data-id="${animal._firebaseId}"
                style="
                    margin-top: 15px;
                    width: 100%;
                    border-color: #8c3b3b;
                    color: #d68787;
                "
            >
                Excluir do Histórico
            </button>

        </div>
    `;
}

// ==========================================================
// CONVERTER DATA
// ==========================================================

function converterDataParaDate(data) {
  if (!data) {
    return null;
  }

  try {
    if (typeof data.toDate === "function") {
      return data.toDate();
    }

    if (typeof data === "string") {
      return new Date(data + "T00:00:00");
    }

    if (data instanceof Date) {
      return data;
    }

    return null;
  } catch (erro) {
    return null;
  }
}

// ==========================================================
// EXCLUIR DO HISTÓRICO
// ==========================================================

async function excluirDoHistorico(firebaseId) {
  if (!firebaseId) {
    alert("Não foi possível identificar o animal.");

    return;
  }

  const confirmar = confirm(
    "Tem certeza que deseja excluir este animal permanentemente do histórico?",
  );

  if (!confirmar) {
    return;
  }

  try {
    await deleteDoc(doc(db, COLECAO_VENDIDOS, firebaseId));

    alert("Animal excluído do histórico com sucesso.");

    await carregarVendidos();
  } catch (erro) {
    console.error("Erro ao excluir animal vendido:", erro);

    alert("Não foi possível excluir o animal do histórico.");
  }
}

// ==========================================================
// EVENTOS
// ==========================================================

function configurarEventos() {
  const container = document.querySelector(".container-animais-vendidos");

  if (!container) {
    return;
  }

  container.onclick = (evento) => {
    const botao = evento.target.closest(".btn-excluir-vendido");

    if (!botao) {
      return;
    }

    const firebaseId = botao.dataset.id;

    excluirDoHistorico(firebaseId);
  };
}
// ==========================================================
// INICIALIZAÇÃO
// ==========================================================

carregarVendidos();
