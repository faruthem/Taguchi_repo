document.addEventListener('DOMContentLoaded', function() {
    // Referencias a los elementos del DOM para la sección QLF
    const qlfChartCtx = document.getElementById('qlfChart').getContext('2d');
    let qlfChart;

    const targetValueInput = document.getElementById('targetValue');
    const specLimitInput = document.getElementById('specLimit');
    const costAtLimitInput = document.getElementById('costAtLimit');
    const observedValueSlider = document.getElementById('observedValueSlider');
    const observedValueLabel = document.getElementById('observedValueLabel');
    const lossValueDisplay = document.getElementById('lossValue');

    /**
     * Calcula la pérdida de calidad basada en los valores de entrada.
     * Actualiza el valor de pérdida en la interfaz y la posición del punto en el gráfico.
     */
    function calculateLoss() {
        const N = parseFloat(targetValueInput.value);
        const LES = parseFloat(specLimitInput.value);
        const C = parseFloat(costAtLimitInput.value);
        const x = parseFloat(observedValueSlider.value);

        // Validar parámetros para evitar errores de división por cero
        if (isNaN(N) || isNaN(LES) || isNaN(C) || N === LES) {
            lossValueDisplay.textContent = 'Parámetros inválidos';
            return;
        }
        
        const delta = Math.abs(LES - N);
        if (delta === 0) {
            lossValueDisplay.textContent = 'Parámetros inválidos';
            return;
        }

        // Calcular la constante de proporcionalidad 'k'
        const k = C / (delta * delta);
        // Calcular la pérdida usando la fórmula de Taguchi
        const loss = k * Math.pow(x - N, 2);

        observedValueLabel.textContent = x.toFixed(1);
        lossValueDisplay.textContent = `$${loss.toFixed(2)}`;
        
        updateChart(x, loss);
    }

    /**
     * Inicializa o reinicializa el gráfico de la Función de Pérdida de Calidad.
     */
    function initializeChart() {
        const N = parseFloat(targetValueInput.value);
        const LES = parseFloat(specLimitInput.value);
        const C = parseFloat(costAtLimitInput.value);

        if (isNaN(N) || isNaN(LES) || isNaN(C) || N === LES) return;
        
        const delta = Math.abs(LES - N);
        const k = C / (delta * delta);
        
        const lowerBound = N - delta;
        const upperBound = N + delta;
        
        // Ajustar los límites del slider para coincidir con la curva
        observedValueSlider.min = lowerBound;
        observedValueSlider.max = upperBound;

        const labels = [];
        const data = [];
        for (let i = lowerBound; i <= upperBound; i += (upperBound - lowerBound) / 50) {
            labels.push(i.toFixed(2));
            data.push(k * Math.pow(i - N, 2));
        }

        // Destruir el gráfico existente si lo hay para evitar superposiciones
        if (qlfChart) {
            qlfChart.destroy();
        }

        qlfChart = new Chart(qlfChartCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Pérdida de Calidad ($)',
                    data: data,
                    borderColor: '#D97706',
                    backgroundColor: 'rgba(217, 119, 6, 0.1)',
                    tension: 0.4,
                    fill: true,
                }, {
                    label: 'Valor Observado',
                    data: [], // El punto de la gráfica se actualiza dinámicamente
                    borderColor: '#1D4ED8',
                    backgroundColor: '#1D4ED8',
                    pointRadius: 8,
                    pointHoverRadius: 10,
                    type: 'scatter',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Pérdida ($)' }
                    },
                    x: {
                        title: { display: true, text: 'Valor de Característica' }
                    }
                }
            }
        });
        calculateLoss();
    }

    /**
     * Actualiza el punto de la gráfica para el valor observado y la pérdida calculada.
     * @param {number} x - El valor observado.
     * @param {number} loss - La pérdida calculada.
     */
    function updateChart(x, loss) {
        if (qlfChart) {
            qlfChart.data.datasets[1].data = [{x: x.toFixed(2), y: loss}];
            qlfChart.update();
        }
    }
    
    // Asignar los listeners de eventos para la sección QLF
    [targetValueInput, specLimitInput, costAtLimitInput].forEach(input => {
        input.addEventListener('input', initializeChart);
    });
    observedValueSlider.addEventListener('input', calculateLoss);

    // Inicializar el gráfico al cargar la página
    initializeChart();

    // Lógica para el cambio de pestañas en la sección "Características"
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');
            contents.forEach(content => {
                if (content.id === target) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
        });
    });
    
    // Lógica para el resaltado de la navegación al hacer scroll
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('main section');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.4
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href').substring(1) === entry.target.id);
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    // Lógica para el scroll suave al hacer clic en la navegación
    navLinks.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
