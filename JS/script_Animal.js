import { db } from "./Firebase.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const COLECAO_ANIMAIS = "animais";
const COLECAO_VENDIDOS = "vendidos";

let animalAtual = null;
let documentoFirebaseAtual = null;

// ==========================================================
// PARÂMETROS DA URL
// ==========================================================

function obterParametrosDaUrl() {

    const params = new URLSearchParams(
        window.location.search
    );

    const loteParam = params.get("lote");
    const idParam = params.get("id");

    return {
        lote: loteParam,
        id: idParam
    };
}

// ==========================================================
// BUSCAR ANIMAL NO FIREBASE
// ==========================================================
//
// Primeiro tenta usar o ID REAL do documento Firebase.
//
// Exemplo:
// ?lote=2&id=SyYTRDMDp7XC8j6eCE4u
//
// Se não encontrar, ainda tenta localizar pelo campo
// "id" numérico que continua sendo o seu Date.now().
// ==========================================================

async function buscarAnimalNoFirebase(lote, id) {

    try {

        // --------------------------------------------------
        // 1. TENTA PELO ID REAL DO DOCUMENTO FIREBASE
        // --------------------------------------------------

        if (id) {

            const referencia = doc(
                db,
                COLECAO_ANIMAIS,
                id
            );

            const documento = await getDoc(
                referencia
            );

            if (documento.exists()) {

                const dados = documento.data();

                // Se o lote estiver na URL, conferimos.
                if (
                    !lote ||
                    String(dados.lote || "Sem Lote") ===
                    String(lote)
                ) {

                    return {
                        ...dados,
                        _firebaseId: documento.id
                    };

                }

            }

        }

        // --------------------------------------------------
        // 2. COMPATIBILIDADE COM O ID ANTIGO Date.now()
        // --------------------------------------------------

        const idNumerico = Number(id);

        if (!isNaN(idNumerico)) {

            const animaisRef = collection(
                db,
                COLECAO_ANIMAIS
            );

            const consulta = query(
                animaisRef,
                where("id", "==", idNumerico)
            );

            const snapshot = await getDocs(
                consulta
            );

            let encontrado = null;

            snapshot.forEach((documento) => {

                const dados = documento.data();

                if (
                    !lote ||
                    String(dados.lote || "Sem Lote") ===
                    String(lote)
                ) {

                    encontrado = {
                        ...dados,
                        _firebaseId: documento.id
                    };

                }

            });

            return encontrado;
        }

        return null;

    } catch (erro) {

        console.error(
            "Erro ao buscar animal no Firebase:",
            erro
        );

        alert(
            "Erro ao carregar o animal do Firebase."
        );

        return null;
    }
}

// ==========================================================
// GARANTIR ARRAYS DO ANIMAL
// ==========================================================

function garantirArraysDoAnimal(animal) {

    if (!Array.isArray(animal.remedios)) {
        animal.remedios = [];
    }

    if (!Array.isArray(animal.gastos)) {
        animal.gastos = [];
    }

    if (!Array.isArray(animal.pesos)) {
        animal.pesos = [];
    }
}

// ==========================================================
// ATUALIZAR ANIMAL NO FIREBASE
// ==========================================================

async function atualizarAnimal(
    funcaoDeAtualizacao
) {

    if (
        !animalAtual ||
        !documentoFirebaseAtual
    ) {

        alert(
            "Animal não carregado."
        );

        return;
    }

    try {

        garantirArraysDoAnimal(
            animalAtual
        );

        // Aplica a alteração
        funcaoDeAtualizacao(
            animalAtual
        );

        // Faz uma cópia
        const dadosParaSalvar = {
            ...animalAtual
        };

        // Nunca salvar o identificador interno
        delete dadosParaSalvar._firebaseId;

        const referencia = doc(
            db,
            COLECAO_ANIMAIS,
            documentoFirebaseAtual
        );

        await updateDoc(
            referencia,
            dadosParaSalvar
        );

        console.log(
            "Animal atualizado no Firebase."
        );

        // Atualiza a tela
        renderizarFichaAnimal(
            document.querySelector(
                ".detalhe-container"
            ),
            animalAtual,
            animalAtual.lote || "Sem Lote"
        );

    } catch (erro) {

        console.error(
            "Erro ao atualizar animal:",
            erro
        );

        alert(
            "Não foi possível salvar a alteração no Firebase."
        );
    }
}

// ==========================================================
// CARREGAR ANIMAL
// ==========================================================

async function carregarAnimal() {

    const container =
        document.querySelector(
            ".detalhe-container"
        );

    const {
        lote,
        id
    } = obterParametrosDaUrl();

    console.log(
        "Parâmetros recebidos:",
        {
            lote,
            id
        }
    );

    // ------------------------------------------------------
    // VERIFICAÇÃO
    // ------------------------------------------------------

    if (!id) {

        exibirErro(
            container,
            "Não foi possível identificar o animal."
        );

        return;
    }

    // ------------------------------------------------------
    // MOSTRA CARREGANDO
    // ------------------------------------------------------

    container.innerHTML = `
        <p class="carregando">
            Carregando animal...
        </p>
    `;

    // ------------------------------------------------------
    // BUSCA NO FIREBASE
    // ------------------------------------------------------

    const animal =
        await buscarAnimalNoFirebase(
            lote,
            id
        );

    if (!animal) {

        exibirErro(
            container,
            "Animal não encontrado no Firebase."
        );

        return;
    }

    // ------------------------------------------------------
    // GUARDA O ANIMAL ATUAL
    // ------------------------------------------------------

    animalAtual = animal;

    documentoFirebaseAtual =
        animal._firebaseId;

    garantirArraysDoAnimal(
        animalAtual
    );

    // ------------------------------------------------------
    // RENDERIZA
    // ------------------------------------------------------

    renderizarFichaAnimal(
        container,
        animalAtual,
        animalAtual.lote || lote || "Sem Lote"
    );

    configurarEventosContainer();

    console.log(
        "Animal carregado:",
        animalAtual
    );

    console.log(
        "ID documento Firebase:",
        documentoFirebaseAtual
    );
}

// ==========================================================
// EXIBIR ERRO
// ==========================================================

function exibirErro(
    container,
    mensagem
) {

    container.innerHTML = `
        <p class="erro">
            ${mensagem}
        </p>
    `;
}

// ==========================================================
// FICHA PRINCIPAL
// ==========================================================

function renderizarFichaAnimal(
    container,
    animal,
    lote
) {

    garantirArraysDoAnimal(
        animal
    );

    const dataFormatada =
        animal.dataCompra
            ? new Date(
                animal.dataCompra +
                "T00:00:00"
            ).toLocaleDateString(
                "pt-BR"
            )
            : "--/--/----";

    container.innerHTML = `

        <!-- ==================================================
             FICHA PRINCIPAL
             ================================================== -->

        <div class="ficha-animal">

            <div class="ficha-header">

                <h2>
                    Nº ${animal.numero}
                </h2>

                <span class="ficha-lote">
                    Lote ${lote}
                </span>

            </div>


            <div class="ficha-dados">

                <div class="dado">

                    <span class="dado-label">
                        Peso Inicial
                    </span>

                    <span class="dado-valor">
                        ${animal.peso} kg
                    </span>

                </div>


                <div class="dado">

                    <span class="dado-label">
                        Data de compra
                    </span>

                    <span class="dado-valor">
                        ${dataFormatada}
                    </span>

                </div>


                <div class="dado">

                    <span class="dado-label">
                        Valor de compra
                    </span>

                    <span class="dado-valor">
                        R$ ${Number(
                            animal.valor || 0
                        ).toFixed(2)}
                    </span>

                </div>


                <div class="dado dado-obs">

                    <span class="dado-label">
                        Observação
                    </span>

                    <span class="dado-valor">
                        ${animal.obs || "Nenhuma"}
                    </span>

                </div>


                <button
                    id="sold-btn"
                    class="btn-vender"
                    onclick="venderBoi()"
                >
                    Marcar como Vendido
                </button>

            </div>

        </div>


        <!-- ==================================================
             REMÉDIOS
             ================================================== -->

        <div
            class="secao-extra"
            id="secao-remedios"
        >

            <h3>
                Remédios / Vacinas
            </h3>


            <form
                id="form-remedio"
                class="form-inline"
            >

                <input
                    type="date"
                    id="input-data-remedio"
                    required
                />


                <input
                    type="text"
                    id="input-nome-remedio"
                    placeholder="Medicação"
                    required
                />


                <button type="submit">
                    Agendar
                </button>

            </form>


            <div
                class="lista-itens"
                id="lista-remedios"
            ></div>

        </div>


        <!-- ==================================================
             GASTOS
             ================================================== -->

        <div
            class="secao-extra"
            id="secao-gastos"
        >

            <h3>
                Gastos do Animal
            </h3>


            <form
                id="form-gasto"
                class="form-inline"
            >

                <input
                    type="text"
                    id="input-descricao-gasto"
                    placeholder="Com o que foi o gasto"
                    required
                />


                <input
                    type="number"
                    id="input-valor-gasto"
                    placeholder="Valor (R$)"
                    min="0"
                    step="0.01"
                    required
                />


                <button type="submit">
                    Adicionar
                </button>

            </form>


            <div
                class="lista-itens"
                id="lista-gastos"
            ></div>


            <div
                class="total-gastos"
                id="total-gastos"
            ></div>

        </div>


        <!-- ==================================================
             HISTÓRICO DE PESO
             ================================================== -->

        <div
            class="secao-extra"
            id="secao-pesos"
        >

            <h3>
                Histórico de Peso
            </h3>


            <form
                id="form-peso"
                class="form-inline"
            >

                <input
                    type="date"
                    id="input-data-peso"
                    required
                />


                <input
                    type="number"
                    id="input-valor-peso"
                    placeholder="Peso (kg)"
                    min="0"
                    step="0.1"
                    required
                />


                <button type="submit">
                    Registrar
                </button>

            </form>


            <div
                class="lista-itens"
                id="lista-pesos"
            ></div>

        </div>

    `;

    renderizarRemedios(
        animal
    );

    renderizarGastos(
        animal
    );

    renderizarPesos(
        animal
    );

    configurarFormularios();
}

// ==========================================================
// VENDER ANIMAL
// ==========================================================

async function venderBoi() {

    const confirmar = confirm(
        "Confirme que este animal foi vendido. " +
        "Ele sairá dos animais e irá para o histórico de vendas."
    );

    if (!confirmar) {
        return;
    }

    if (
        !animalAtual ||
        !documentoFirebaseAtual
    ) {

        alert(
            "Animal não carregado."
        );

        return;
    }

    try {

        // --------------------------------------------------
        // PREPARA DADOS DA VENDA
        // --------------------------------------------------

        const dadosVenda = {
            ...animalAtual,

            dataVenda:
                new Date()
                    .toISOString()
                    .split("T")[0]
        };

        delete dadosVenda._firebaseId;

        // --------------------------------------------------
        // SALVA NA COLEÇÃO VENDIDOS
        // --------------------------------------------------

        await addDoc(
            collection(
                db,
                COLECAO_VENDIDOS
            ),
            dadosVenda
        );

        // --------------------------------------------------
        // REMOVE DOS ANIMAIS
        // --------------------------------------------------

        await deleteDoc(
            doc(
                db,
                COLECAO_ANIMAIS,
                documentoFirebaseAtual
            )
        );

        alert(
            "Animal marcado como VENDIDO com sucesso!"
        );

        window.location.href =
            "/HTML/Vendidos.html";

    } catch (erro) {

        console.error(
            "Erro ao vender animal:",
            erro
        );

        alert(
            "Não foi possível marcar o animal como vendido."
        );
    }
}

// ==========================================================
// REMÉDIOS
// ==========================================================

function renderizarRemedios(
    animal
) {

    const lista =
        document.getElementById(
            "lista-remedios"
        );

    if (!lista) {
        return;
    }

    const remediosOrdenados =
        [...animal.remedios].sort(
            (a, b) =>
                new Date(a.data) -
                new Date(b.data)
        );

    if (
        remediosOrdenados.length === 0
    ) {

        lista.innerHTML = `
            <p class="lista-vazia">
                Nenhum remédio ou vacina agendado.
            </p>
        `;

        return;
    }

    lista.innerHTML =
        remediosOrdenados
            .map((r) => {

                const dataFormatada =
                    new Date(
                        r.data +
                        "T00:00:00"
                    ).toLocaleDateString(
                        "pt-BR"
                    );

                return `
                    <div
                        class="item-linha ${
                            r.aplicado
                                ? "item-concluido"
                                : ""
                        }"
                    >

                        <label class="item-checkbox">

                            <input
                                type="checkbox"
                                data-tipo="remedio"
                                data-id="${r.id}"
                                ${
                                    r.aplicado
                                        ? "checked"
                                        : ""
                                }
                            />

                            <span>
                                ${dataFormatada}
                                •
                                ${r.nome}
                            </span>

                        </label>


                        <button
                            class="btn-remover-item"
                            data-tipo="remedio"
                            data-id="${r.id}"
                        >
                            ×
                        </button>

                    </div>
                `;
            })
            .join("");
}

// ==========================================================
// GASTOS
// ==========================================================

function renderizarGastos(
    animal
) {

    const lista =
        document.getElementById(
            "lista-gastos"
        );

    const totalDiv =
        document.getElementById(
            "total-gastos"
        );

    if (!lista) {
        return;
    }

    if (
        animal.gastos.length === 0
    ) {

        lista.innerHTML = `
            <p class="lista-vazia">
                Nenhum gasto registrado.
            </p>
        `;

        if (totalDiv) {
            totalDiv.innerHTML = "";
        }

        return;
    }

    lista.innerHTML =
        animal.gastos
            .map(
                (g) => `
                    <div class="item-linha">

                        <span>
                            ${g.descricao}
                            —
                            R$ ${Number(
                                g.valor || 0
                            ).toFixed(2)}
                        </span>


                        <button
                            class="btn-remover-item"
                            data-tipo="gasto"
                            data-id="${g.id}"
                        >
                            ×
                        </button>

                    </div>
                `
            )
            .join("");

    const total =
        animal.gastos.reduce(
            (acc, g) =>
                acc +
                Number(
                    g.valor || 0
                ),
            0
        );

    if (totalDiv) {

        totalDiv.innerHTML = `
            <strong>Total gasto:</strong>
            R$ ${total.toFixed(2)}
        `;
    }
}

// ==========================================================
// HISTÓRICO DE PESOS
// ==========================================================

function renderizarPesos(
    animal
) {

    const lista =
        document.getElementById(
            "lista-pesos"
        );

    if (!lista) {
        return;
    }

    const pesosOrdenados =
        [...animal.pesos].sort(
            (a, b) =>
                new Date(a.data) -
                new Date(b.data)
        );

    if (
        pesosOrdenados.length === 0
    ) {

        lista.innerHTML = `
            <p class="lista-vazia">
                Nenhum registro de peso ainda.
            </p>
        `;

        return;
    }

    let pesoAnterior =
        Number(animal.peso);

    let dataAnterior =
        animal.dataCompra
            ? new Date(
                animal.dataCompra +
                "T00:00:00"
            )
            : null;

    lista.innerHTML =
        pesosOrdenados
            .map((p) => {

                const dataAtual =
                    new Date(
                        p.data +
                        "T00:00:00"
                    );

                const dataFormatada =
                    dataAtual.toLocaleDateString(
                        "pt-BR"
                    );

                let gmdText = "---";

                if (dataAnterior) {

                    const diferencaTempo =
                        Math.abs(
                            dataAtual -
                            dataAnterior
                        );

                    const diasPassados =
                        Math.round(
                            diferencaTempo /
                            (
                                1000 *
                                60 *
                                60 *
                                24
                            )
                        );

                    if (
                        diasPassados > 0
                    ) {

                        const gmd =
                            (
                                Number(p.peso) -
                                pesoAnterior
                            ) /
                            diasPassados;

                        gmdText =
                            `${gmd.toFixed(
                                3
                            )} kg/dia`;

                    } else {

                        gmdText =
                            "Mesmo dia";
                    }

                } else {

                    gmdText =
                        "S/ Data Inic.";
                }

                pesoAnterior =
                    Number(p.peso);

                dataAnterior =
                    dataAtual;

                return `
                    <div class="item-linha">

                        <span>

                            ${dataFormatada}
                            —
                            ${p.peso} kg

                            <span
                                style="
                                    color: #8eb69b;
                                    font-size: 0.85em;
                                    margin-left: 10px;
                                "
                            >
                                (GMD:
                                ${gmdText})
                            </span>

                        </span>


                        <button
                            class="btn-remover-item"
                            data-tipo="peso"
                            data-id="${p.id}"
                        >
                            ×
                        </button>

                    </div>
                `;
            })
            .join("");
}

// ==========================================================
// GERAR ID
// ==========================================================
//
// MANTIDO EXATAMENTE COMO VOCÊ JÁ USAVA.
// ==========================================================

function gerarId() {

    return (
        Date.now() +
        Math.floor(
            Math.random() * 1000
        )
    );
}

// ==========================================================
// FORMULÁRIOS
// ==========================================================

function configurarFormularios() {

    const formRemedio =
        document.getElementById(
            "form-remedio"
        );

    const formGasto =
        document.getElementById(
            "form-gasto"
        );

    const formPeso =
        document.getElementById(
            "form-peso"
        );

    // ------------------------------------------------------
    // REMÉDIO
    // ------------------------------------------------------

    if (formRemedio) {

        formRemedio.onsubmit =
            async (evento) => {

                evento.preventDefault();

                const data =
                    document.getElementById(
                        "input-data-remedio"
                    ).value;

                const nome =
                    document.getElementById(
                        "input-nome-remedio"
                    ).value.trim();

                if (
                    !data ||
                    !nome
                ) {
                    return;
                }

                await atualizarAnimal(
                    (animal) => {

                        animal.remedios.push({
                            id: gerarId(),
                            data: data,
                            nome: nome,
                            aplicado: false
                        });

                    }
                );
            };
    }

    // ------------------------------------------------------
    // GASTO
    // ------------------------------------------------------

    if (formGasto) {

        formGasto.onsubmit =
            async (evento) => {

                evento.preventDefault();

                const descricao =
                    document.getElementById(
                        "input-descricao-gasto"
                    ).value.trim();

                const valor =
                    parseFloat(
                        document.getElementById(
                            "input-valor-gasto"
                        ).value
                    );

                if (
                    !descricao ||
                    isNaN(valor) ||
                    valor <= 0
                ) {
                    return;
                }

                await atualizarAnimal(
                    (animal) => {

                        animal.gastos.push({
                            id: gerarId(),
                            descricao: descricao,
                            valor: valor
                        });

                    }
                );
            };
    }

    // ------------------------------------------------------
    // PESO
    // ------------------------------------------------------

    if (formPeso) {

        formPeso.onsubmit =
            async (evento) => {

                evento.preventDefault();

                const data =
                    document.getElementById(
                        "input-data-peso"
                    ).value;

                const peso =
                    parseFloat(
                        document.getElementById(
                            "input-valor-peso"
                        ).value
                    );

                if (
                    !data ||
                    isNaN(peso) ||
                    peso <= 0
                ) {
                    return;
                }

                await atualizarAnimal(
                    (animal) => {

                        animal.pesos.push({
                            id: gerarId(),
                            data: data,
                            peso: peso
                        });

                    }
                );
            };
    }
}

// ==========================================================
// EVENTOS
// ==========================================================

function configurarEventosContainer() {

    const container =
        document.querySelector(
            ".detalhe-container"
        );

    if (!container) {
        return;
    }

    // ------------------------------------------------------
    // CHECKBOX DE REMÉDIO
    // ------------------------------------------------------

    container.addEventListener(
        "change",
        async (evento) => {

            const alvo =
                evento.target;

            if (
                !alvo.matches(
                    'input[type="checkbox"][data-tipo="remedio"]'
                )
            ) {
                return;
            }

            const id =
                Number(
                    alvo.dataset.id
                );

            await atualizarAnimal(
                (animal) => {

                    const remedio =
                        animal.remedios.find(
                            (r) =>
                                Number(r.id) ===
                                id
                        );

                    if (remedio) {

                        remedio.aplicado =
                            alvo.checked;
                    }
                }
            );
        }
    );

    // ------------------------------------------------------
    // BOTÕES DE REMOVER
    // ------------------------------------------------------

    container.addEventListener(
        "click",
        async (evento) => {

            const alvo =
                evento.target;

            if (
                !alvo.classList.contains(
                    "btn-remover-item"
                )
            ) {
                return;
            }

            const tipo =
                alvo.dataset.tipo;

            const id =
                Number(
                    alvo.dataset.id
                );

            await atualizarAnimal(
                (animal) => {

                    if (
                        tipo === "remedio"
                    ) {

                        animal.remedios =
                            animal.remedios.filter(
                                (r) =>
                                    Number(r.id) !==
                                    id
                            );
                    }

                    else if (
                        tipo === "gasto"
                    ) {

                        animal.gastos =
                            animal.gastos.filter(
                                (g) =>
                                    Number(g.id) !==
                                    id
                            );
                    }

                    else if (
                        tipo === "peso"
                    ) {

                        animal.pesos =
                            animal.pesos.filter(
                                (p) =>
                                    Number(p.id) !==
                                    id
                            );
                    }

                }
            );
        }
    );
}

// ==========================================================
// DISPONIBILIZAR PARA O HTML
// ==========================================================

window.venderBoi =
    venderBoi;

// ==========================================================
// INICIALIZAÇÃO
// ==========================================================

carregarAnimal();