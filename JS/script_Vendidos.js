const CHAVE_VENDIDOS = "confinamento_animais_vendidos";

function carregarVendidos() {
  const container = document.querySelector(".container-animais-vendidos");
  const resumoDiv = document.getElementById("resumo-vendas");
  let vendidos = [];

  try {
    const bruto = localStorage.getItem(CHAVE_VENDIDOS);
    if (bruto) vendidos = JSON.parse(bruto);
  } catch (e) {}

  if (vendidos.length === 0) {
    container.innerHTML = `<p class="sem-dados" style="color: #8eb69b;">Nenhum animal foi vendido ainda. O seu histórico está vazio.</p>`;
    resumoDiv.style.display = "none";
    return;
  }

  // Ordena para que os vendidos mais recentes fiquem em cima
  vendidos.sort((a, b) => new Date(b.dataVenda) - new Date(a.dataVenda));

  let totalAnimaisVendidos = vendidos.length;
  let totalInvestido = 0; // Compra + Gastos

  let htmlCards = '<div class="lista-bois">';

  vendidos.forEach((animal) => {
    // 1. Datas
    const dataCompra = animal.dataCompra
      ? new Date(animal.dataCompra + "T00:00:00").toLocaleDateString("pt-BR")
      : "--/--/----";
    const dataVenda = animal.dataVenda
      ? new Date(animal.dataVenda + "T00:00:00").toLocaleDateString("pt-BR")
      : "--/--/----";

    // 2. Cálculos Totais
    const gastosSeguros = animal.gastos || [];
    const pesosSeguros = animal.pesos || [];
    const remediosSeguros = animal.remedios || [];

    const totalGastos = gastosSeguros.reduce((acc, g) => acc + g.valor, 0);
    const custoTotal = (animal.valor || 0) + totalGastos;
    totalInvestido += custoTotal;

    // 3. Montagem do Histórico Completo em HTML
    
    // --- Histórico de Pesos e Cálculo de GMD ---
    // AQUI MUDAMOS O #ffd477 PARA #8eb69b E A BORDA PARA #163832
    let pesosHTML = `
      <div style="background-color: rgba(0, 0, 0, 0.15); padding: 10px; border-radius: 8px; margin: 10px 0; border: 1px solid #163832;">
        <h4 style="color: #8eb69b; margin-top: 0; margin-bottom: 8px; font-size: 1em; border-bottom: 1px dashed #163832; padding-bottom: 4px;">Histórico de Pesagem</h4>
        <div style="font-size: 0.9em; margin-bottom: 4px;">${dataCompra}: <strong>${animal.peso} kg</strong> <span style="color: #8eb69b; font-size: 0.9em;">(Inicial)</span></div>
    `;

    let ultimoPeso = animal.peso; // Começa assumindo o peso inicial
    
    if (pesosSeguros.length > 0) {
      const pesosOrdenados = [...pesosSeguros].sort(
        (a, b) => new Date(a.data) - new Date(b.data),
      );
      
      let pesoAnterior = animal.peso; 
      let dataAnterior = animal.dataCompra ? new Date(animal.dataCompra + "T00:00:00") : null;

      pesosHTML += pesosOrdenados
        .map((p) => {
          const dataAtual = new Date(p.data + "T00:00:00");
          const d = dataAtual.toLocaleDateString("pt-BR");
          
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

          // Atualiza para o próximo loop
          pesoAnterior = p.peso;
          dataAnterior = dataAtual;
          ultimoPeso = p.peso; // Atualiza o último peso real

          return `<div style="font-size: 0.9em; margin-bottom: 4px;">${d}: <strong>${p.peso} kg</strong> <span style="color: #8eb69b; font-size: 0.9em;">(GMD: ${gmdText})</span></div>`;
        })
        .join("");
    }
    pesosHTML += `</div>`; // Fecha a caixa de pesagens

    // --- Histórico de Gastos ---
    let gastosHTML = "";
    if (gastosSeguros.length > 0) {
      gastosHTML = gastosSeguros
        .map((g) => {
          return `<li>${g.descricao}: <strong>R$ ${g.valor.toFixed(2)}</strong></li>`;
        })
        .join("");
    } else {
      gastosHTML = "<li><em>Nenhum gasto extra registrado</em></li>";
    }

    // --- Histórico de Remédios ---
    let remediosHTML = "";
    if (remediosSeguros.length > 0) {
      remediosHTML = remediosSeguros
        .map((r) => {
          const d = new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR");
          const status = r.aplicado
            ? '<span style="color: #8eb69b;">(Aplicado)</span>'
            : '<span style="color: #e57373;">(Pendente)</span>';
          return `<li>${d} - ${r.nome} ${status}</li>`;
        })
        .join("");
    } else {
      remediosHTML = "<li><em>Nenhum remédio registrado</em></li>";
    }

    // 4. Montagem do Card Final (Cores atualizadas para o verde base)
    htmlCards += `
      <div class="card-animal card-vendido">
        <div class="card-numero" style="color: #8eb69b;"><strong>Nº ${animal.numero}</strong> <span style="font-size: 0.7em; color: #ccc;">(Lote: ${animal.lote || "S/L"})</span></div>
        
        <div class="card-info" style="line-height: 1.5; margin-top: 10px;">
          <strong>Compra:</strong> ${dataCompra}<br>
          <strong>Venda:</strong> <span style="color: #8eb69b;">${dataVenda}</span><br>
          
          <!-- Histórico de Pesos e GMD Injetado Aqui -->
          ${pesosHTML}
          
          <hr class="linha-divisoria">
          <strong>Custo Total:</strong> R$ ${custoTotal.toFixed(2)}<br>
          <span style="font-size: 0.8em; color: #aaa;">(Valor animal R$ ${(animal.valor || 0).toFixed(2)} + Gastos R$ ${totalGastos.toFixed(2)})</span>
        </div>

        <details class="detalhes-historico">
          <summary>Ver Gastos, Remédios e Obs</summary>
          <div class="historico-conteudo">
            <h4>Gastos Realizados</h4>
            <ul>${gastosHTML}</ul>

            <h4>Remédios / Vacinas</h4>
            <ul>${remediosHTML}</ul>
            
            <h4>Observação Inicial</h4>
            <p>${animal.obs || "Nenhuma observação registrada na entrada."}</p>
          </div>
        </details>

        <button class="btn-remover" onclick="excluirDoHistorico(${animal.id})" style="margin-top: 15px; width: 100%; border-color: #8c3b3b; color: #d68787;">Excluir do Histórico</button>
      </div>
    `;
  });

  htmlCards += "</div>";
  container.innerHTML = htmlCards;

  // Renderiza o cabeçalho de resumo das vendas
  resumoDiv.style.display = "flex";
  resumoDiv.innerHTML = `
    <div class="resumo-item"><strong>${totalAnimaisVendidos}</strong> animal(is) vendido(s)</div>
    <div class="resumo-item"><strong>R$ ${totalInvestido.toFixed(2)}</strong> custo total acumulado neles</div>
  `;
}

function excluirDoHistorico(id) {
  const confirmar = confirm("Tem certeza que deseja excluir este animal permanentemente do histórico?");
  if (!confirmar) return;
  
  let vendidos = [];
  try {
    const bruto = localStorage.getItem(CHAVE_VENDIDOS);
    if (bruto) vendidos = JSON.parse(bruto);
  } catch (e) {}
  
  vendidos = vendidos.filter((animal) => animal.id !== id);
  
  localStorage.setItem(CHAVE_VENDIDOS, JSON.stringify(vendidos));
  carregarVendidos();
}

window.excluirDoHistorico = excluirDoHistorico;
window.onload = carregarVendidos;