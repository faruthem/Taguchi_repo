// Este código controla la interactividad de la página web.

// ----------------------------------------------------
// Lógica para el Explorador Interactivo de la QLF
// ----------------------------------------------------

// Obtener elementos del DOM para el QLF
const targetValueInput = document.getElementById('targetValue');
const specLimitInput = document.getElementById('specLimit');
const costAtLimitInput = document.getElementById('costAtLimit');
const observedValueSlider = document.getElementById('observedValueSlider');
const observedValueLabel = document.getElementById('observedValueLabel');
const lossValueDisplay = document.getElementById('lossValue');
const qlfCanvas = document.getElementById('qlfChart');

// Inicializar la gráfica de QLF
const qlfChart = new Chart(qlfCanvas, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Función de Pérdida',
            data: [],
            borderColor: 'rgb(217, 119, 6)',
            backgroundColor: 'rgba(217, 119, 6, 0.2)',
            fill: true,
            tension: 0.1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Valor Observado (x)'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Pérdida ($)'
                },
                beginAtZero: true
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    title: function(context) {
                        return `Valor: ${context[0].label}`;
                    },
                    label: function(context) {
                        return `Pérdida: $${context.formattedValue}`;
                    }
                }
            }
        }
    }
});

// Función para calcular la pérdida de Taguchi (QLF) y actualizar la gráfica
function updateQLF() {
    // Obtener valores de los inputs
    const N = parseFloat(targetValueInput.value);
    const LES = parseFloat(specLimitInput.value);
    const C = parseFloat(costAtLimitInput.value);
    const x = parseFloat(observedValueSlider.value);

    // Validar entradas
    if (isNaN(N) || isNaN(LES) || isNaN(C) || isNaN(x)) {
        console.error("Entradas no válidas para la QLF.");
        return;
    }

    // Calcular la constante de proporcionalidad 'k'
    const delta0 = LES - N;
    const k = C / (delta0 * delta0);

    // Calcular la pérdida para el valor observado 'x'
    const loss = k * Math.pow(x - N, 2);
    lossValueDisplay.textContent = `$${loss.toFixed(2)}`;
    
    // Actualizar el valor del slider
    observedValueLabel.textContent = x;

    // Generar datos para la gráfica
    const dataPoints = [];
    const labels = [];
    const start = N - delta0;
    const end = N + delta0;

    for (let i = start; i <= end; i += 0.1) {
        labels.push(i.toFixed(1));
        const lossValue = k * Math.pow(i - N, 2);
        dataPoints.push(lossValue);
    }

    qlfChart.data.labels = labels;
    qlfChart.data.datasets[0].data = dataPoints;
    qlfChart.update();
}

// Escuchar cambios en los inputs del QLF
targetValueInput.addEventListener('input', updateQLF);
specLimitInput.addEventListener('input', updateQLF);
costAtLimitInput.addEventListener('input', updateQLF);
observedValueSlider.addEventListener('input', updateQLF);

// ----------------------------------------------------
// Lógica para las pestañas de Tipos de Características
// ----------------------------------------------------

const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Eliminar clase activa de todos los botones y contenidos
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.add('hidden'));

        // Agregar clase activa al botón y contenido seleccionados
        const tabId = button.dataset.tab;
        button.classList.add('active');
        document.getElementById(tabId).classList.remove('hidden');
    });
});

// ----------------------------------------------------
// Nuevas Fórmulas de la Descomposición de la Sumatoria de Cuadrados (SST, SSe, SSm)
// A partir de la imagen proporcionada por el usuario.
// ----------------------------------------------------

/**
 * Calcula los componentes de la suma de cuadrados (SST, SSe, SSm)
 * para los tres tipos de características de calidad según Taguchi.
 * @param {string} type - El tipo de característica de calidad ('nominal', 'smaller', 'larger').
 * @param {Array<number>} data - Un array de valores observados (y_i).
 * @param {number} [target=0] - El valor nominal o ideal (y_0). Requerido para 'nominal'.
 * @returns {{SST: number, SSe: number, SSm: number}} Los valores calculados.
 */
function calculateTaguchiSumsOfSquares(type, data, target = 0) {
    let sumOfSquaresTotal = 0;
    let sumOfSquaresError = 0;
    let sumOfSquaresMean = 0;
    let n = data.length;

    if (n === 0) {
        return { SST: 0, SSe: 0, SSm: 0 };
    }

    switch (type) {
        case 'nominal':
            // Nominal es Mejor
            let sumYiMinusY0 = 0;
            let sumYi = 0;

            for (let i = 0; i < n; i++) {
                sumOfSquaresTotal += Math.pow(data[i] - target, 2);
                sumYiMinusY0 += (data[i] - target);
                sumYi += data[i];
            }

            const yBar = sumYi / n;
            for (let i = 0; i < n; i++) {
                sumOfSquaresError += Math.pow(data[i] - yBar, 2);
            }
            sumOfSquaresMean = Math.pow(sumYiMinusY0, 2) / n;
            break;

        case 'smaller':
            // Menor es Mejor
            let sumYiSmaller = 0;

            for (let i = 0; i < n; i++) {
                sumOfSquaresTotal += Math.pow(data[i], 2);
                sumYiSmaller += data[i];
            }

            const yBarSmaller = sumYiSmaller / n;
            for (let i = 0; i < n; i++) {
                sumOfSquaresError += Math.pow(data[i] - yBarSmaller, 2);
            }
            sumOfSquaresMean = Math.pow(sumYiSmaller, 2) / n;
            break;

        case 'larger':
            // Mayor es Mejor
            let sumOneOverYi = 0;

            for (let i = 0; i < n; i++) {
                if (data[i] !== 0) {
                    sumOfSquaresTotal += Math.pow(1 / data[i], 2);
                    sumOneOverYi += (1 / data[i]);
                }
            }
            
            const oneOverYBar = sumOneOverYi / n;
            for (let i = 0; i < n; i++) {
                if (data[i] !== 0) {
                    sumOfSquaresError += Math.pow((1 / data[i]) - oneOverYBar, 2);
                }
            }
            sumOfSquaresMean = Math.pow(sumOneOverYi, 2) / n;
            break;

        default:
            console.error("Tipo de característica no válido.");
            break;
    }

    return {
        SST: sumOfSquaresTotal,
        SSe: sumOfSquaresError,
        SSm: sumOfSquaresMean
    };
}

// Ejemplo de uso de las nuevas fórmulas
const nominalData = [10.2, 9.8, 10.1, 9.9];
const nominalTarget = 10;
const nominalResults = calculateTaguchiSumsOfSquares('nominal', nominalData, nominalTarget);
console.log('Resultados para "Nominal es Mejor":', nominalResults);

const smallerData = [0.1, 0.05, 0.15, 0.08];
const smallerResults = calculateTaguchiSumsOfSquares('smaller', smallerData);
console.log('Resultados para "Menor es Mejor":', smallerResults);

const largerData = [50, 55, 48, 52];
const largerResults = calculateTaguchiSumsOfSquares('larger', largerData);
console.log('Resultados para "Mayor es Mejor":', largerResults);

// Inicializar la página al cargar
window.onload = function() {
    updateQLF();
};
