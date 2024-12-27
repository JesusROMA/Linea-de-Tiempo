let currentPage = 1;
const itemsPerPage = 6;
let loading = false;

let data = [];
let weekData = [];
let currentWeek = null;

// Definir dimensiones del SVG
const svgWidth = 1200;
const svgHeight = 400;

async function fetchData() {
    try {
        const response = await fetch('data_convertido.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const jsonData = await response.json();
        data = jsonData["filas a programar"];
        renderTimeline(data);
        document.getElementById('loader').style.display = 'none';
        document.getElementById('infoTable').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        addTooltipListeners();
    } catch (error) {
        console.error('Failed to fetch data:', error);
    }
}

function parseDate(dateString) {
    const formats = [
        { regex:/^(\d{2})\/(\d{2})\/(\d{4})$/, order:['day','month','year'] },
        { regex:/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/, order:['month','day','year'] }
    ];

    for (const format of formats) {
        const match = dateString.match(format.regex);
        if (match) {
            const [_, part1, part2, part3] = match;
            const parts = {
                day: Number(format.order[0] === 'day' ? part1 : part2),
                month: Number(format.order[0] === 'day' ? part2 : part1) - 1,
                year: Number(part3.length === 2 ? '20' + part3 : part3)
            };
            return new Date(parts.year, parts.month, parts.day);
        }
    }
    return null;
}

// Abrir el modal
function showModal(itemId) {
    const item = data[parseInt(itemId)]; // Obtener el elemento usando el ID dinámico (restar 1 por el índice)
    if (!item) return;

    const modalContent = `
         <table class="modal-table">
            <tr>
                <th>INICIO</th>
                <td>${item["Inicio "]}</td>
            </tr>
            <tr>
                <th>FIN</th>
                <td>${item.Fin}</td>
            </tr>
            <tr>
                <th>DURACIÓN</th>
                <td>${item.Duración}</td>
            </tr>
            <tr>
                <th>STOPPER</th>
                <td>${item.Stoper || ''}</td>
            </tr>
        </table>
    `;
    
    const modal = document.getElementById('modal');
    if (modal) {
        modal.querySelector('.modal-content').innerHTML = modalContent;
        modal.style.display = 'flex';
    }
}


// Cerrar el modal al hacer clic en el botón de cierre
document.addEventListener('DOMContentLoaded', () => {
    const closeModalButton = document.querySelector('.modal-close');
    
    if (closeModalButton) {
        closeModalButton.addEventListener('click', () => {
            document.getElementById('modal').style.display = 'none';
        });
    }
});

window.onclick = function(event) {
    const modal = document.getElementById('modal');
    const infoTableModal = document.getElementById('infoTableModal');

    if (modal && event.target === modal) {
        modal.style.display = 'none';
    }
    if (infoTableModal && event.target === infoTableModal) {
        infoTableModal.style.display = 'none';
    }
};


// Renderizar una porción de los datos
function renderTable() {
    document.getElementById('infoTable').style.display = 'table';
    const tbody = document.querySelector('#infoTable tbody');

    // Si deseas mostrar todos los elementos, no uses paginación
    const paginatedItems = weekData; // Mostrar todos los elementos de weekData

    tbody.innerHTML = "";

    paginatedItems.forEach(item => {
        const row = document.createElement('tr');
        row.classList.add('clickable-row');
        const originalIndex = data.indexOf(item);
        row.dataset.id = originalIndex; 

        row.innerHTML = `
            <td style="display: none;">${currentWeek}</td>
            <td>${item.Actividad}</td>
            <td>${item.Responsable}</td>
            <td style="text-align: center;">${item.Duración.replace(/dura/i, '')}</td>
            <td style="text-align: center;">${item["Inicio "].length > 10 ? item["Inicio "].slice(0, 10) + '...' : item["Inicio "]}</td>
            <td style="display: none;">${item.Fin.length > 10 ? item.Fin.slice(0, 10) + '...' : item.Fin}</td>
            <td style="display: none;">${item.Evento.length > 15 ? item.Evento.slice(0, 15) + '...' : item.Evento}</td>
            <td style="text-align: center;" >${item["Días al Evento"]}</td>
            <td style="display: none;">${item.Stoper ? item.Stoper.slice(0, 10) : 'N/A'}</td>
        `;
        tbody.appendChild(row);
    });

    // Añadir event listener para mostrar modal al hacer clic en cualquier parte de la fila
    document.querySelectorAll('.clickable-row').forEach(row => {
        row.addEventListener('click', (event) => {
            const itemId = event.currentTarget.dataset.id;
            showModal(itemId);
        });
    });
    
    // Indicar que ya no estamos cargando
    loading = false;
    showInfoTable();
}

// Detectar el scroll para cargar más datos
document.querySelector('.track-container').addEventListener('scroll', function() {
    const { scrollTop, scrollHeight, clientHeight } = this;

    // Verificar si estamos en la parte inferior de la tabla y si no estamos ya cargando
    if (scrollTop + clientHeight >= scrollHeight - 5 && !loading) {
        loading = true; // Indicar que estamos cargando
        currentPage++;
        renderTable(); // Cargar más datos
    }
});
function showInfoTable() {
    const infoTableModal = document.getElementById('infoTableModal');
    if (infoTableModal) {
        infoTableModal.style.display = 'flex';
    }
}

// Cerrar el modal de la tabla
document.addEventListener('DOMContentLoaded', () => {
    const closeInfoTableButton = document.querySelector('#infoTableModal .modal-close2');
    
    if (closeInfoTableButton) {
        closeInfoTableButton.addEventListener('click', () => {
            document.getElementById('infoTableModal').style.display = 'none';
        });
    }
});

function createSVGPath() {
    const trackPath = `M 142 216 
    L 1205 216 
    A 90 90 0 0 1 1284 308 
    L 1282 891 
    A 50 50 0 0 1 1238 937 
    L 170 937 
    A 50 50 0 0 1 124 892 
    L 124 484`;
return trackPath;

}


function renderTimeline(data) {
    const { minDate, maxDate } = getFirstAndLastEventDates(data);
    const numberOfWeeks = getWeekNumberFromDate(maxDate, minDate); // Número de semanas entre las dos fechas
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = '';

    const trackPath = createSVGPath();
    const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathElement.setAttribute('d', trackPath);
    pathElement.setAttribute('fill', 'none');
    pathElement.setAttribute('stroke', '#515a5a');
    pathElement.setAttribute('stroke-width', '40');
    pathElement.setAttribute('class', 'track');
    pathElement.setAttribute('id', 'raceTrack');
    timeline.appendChild(pathElement);

    const segmentWidth = pathElement.getTotalLength() / numberOfWeeks;


    for (let week = 1; week <= numberOfWeeks; week++) {
        const positionX = (week - 1) * segmentWidth;
        const pointPositionCircle = pathElement.getPointAtLength(positionX);


        
        // Obtener las fechas de inicio y fin de la semana actual
        const weekStartDate = new Date(minDate);
        weekStartDate.setDate(minDate.getDate() + (week - 1) * 7);
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 6);
 
        let weekdat = formatWeekRange(weekStartDate, weekEndDate);


        const segment = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        segment.setAttribute('x', pointPositionCircle.x - (segmentWidth / 2));
        segment.setAttribute('y', pointPositionCircle.y - (25 / 2));
        segment.setAttribute('width', segmentWidth);
        segment.setAttribute('height', 25);
        segment.setAttribute('class', 'weekly-segment');
        segment.setAttribute('data-week', week);
        segment.setAttribute('weekdat', weekdat);

        segment.addEventListener('click', () => {
            currentWeek = week;
            weekData = data.filter(item => eventOccursInWeek(item, week, minDate));
            currentPage = 1;
            renderTable();
            showF1Car(pointPositionCircle.x, pointPositionCircle.y, pathElement);
        });

        timeline.appendChild(segment);
    }

    // Mostrar eventos en las semanas correspondientes
    data.forEach(item => {
        const startDate = parseDate(item["Inicio "]);
        const endDate = parseDate(item["Fin"]);
        const startWeek = getWeekNumberFromDate(startDate, minDate);
        const endWeek = getWeekNumberFromDate(endDate, minDate);
    
        for (let week = startWeek; week <= endWeek; week++) {
            const positionX = (week - 1) * segmentWidth + 20;
            const pointPosition = pathElement.getPointAtLength(positionX);
    
            if (pointPosition) {
                // Obtener un punto cercano para calcular el ángulo de la tangente
                const pointAhead = pathElement.getPointAtLength(positionX + 1); // Un punto más adelante
                const angle = Math.atan2(pointAhead.y - pointPosition.y, pointAhead.x - pointPosition.x); // Ángulo de la línea en radianes
    
                // Crear un elemento línea
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    
                // Definir la longitud de la línea y calcular las posiciones iniciales y finales
                const lineLength = 20; // Puedes ajustar la longitud de la línea
                const dx = (lineLength / 2) * Math.cos(angle); // Desplazamiento en x según el ángulo
                const dy = (lineLength / 2) * Math.sin(angle); // Desplazamiento en y según el ángulo
    
                // Establecer las coordenadas iniciales y finales de la línea según el ángulo
                line.setAttribute('x1', pointPosition.x - dx);
                line.setAttribute('y1', pointPosition.y - dy);
                line.setAttribute('x2', pointPosition.x + dx);
                line.setAttribute('y2', pointPosition.y + dy);
    
                // Estilo de la línea
                line.setAttribute('stroke', '#e62e1b');  // Color de la línea
                line.setAttribute('stroke-width', 8);  // Grosor de la línea
                line.setAttribute('class', 'point-line');  // Clase para darle estilos adicionales si es necesario
    
                // Título o información adicional para la línea (como se hacía con el círculo)
                line.title = `Actividad: ${item.Actividad}\nResponsable: ${item.Responsable}\nDuración: ${Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))} días\nInicio: ${item["Inicio "]}\nFin: ${item.Fin}\nEvento: ${item.Evento}\nDías al Evento: ${item["Días al Evento"]}\nStopper: ${item.Stoper || 'N/A'}`;
                line.week = week;

                const segmentWidth = pathElement.getTotalLength() / numberOfWeeks;
                // Obtener las fechas de inicio y fin de la semana actual
                const weekStartDate = new Date(minDate);
                weekStartDate.setDate(minDate.getDate() + (week - 1) * 7);
                const weekEndDate = new Date(weekStartDate);
                weekEndDate.setDate(weekEndDate.getDate() + 6);
         
                let weekdat = formatWeekRange(weekStartDate, weekEndDate);

                line.weekDataForm = weekdat;

                // Añadir evento de click en la línea
                line.addEventListener('click', () => {
                    currentWeek = week;
                    weekData = data.filter(item => eventOccursInWeek(item, week, minDate));
                    currentPage = 1;
                    renderTable();
                    showF1Car(pointPosition.x, pointPosition.y, pathElement);
                });
    
                timeline.appendChild(line);
            }
        }
    });
}

function formatWeekRange(startDate, endDate) {
    const options = { day: 'numeric', month: 'long' }; // Formato de día y mes
    let start = startDate.toLocaleDateString('es-ES', options);
    let end = endDate.toLocaleDateString('es-ES', options);
   
    start = start.replace(' de ', ' ');
    end = end.replace(' de ', ' ');
    

    let splitStart = start.split(' ');
    let splitEnd = end.split(' ');

    let monthStart = splitStart[1].charAt(0).toUpperCase() + splitStart[1].slice(1);
    let monthEnd = splitEnd[1].charAt(0).toUpperCase() + splitEnd[1].slice(1);
    
    return `${splitStart[0]} ${monthStart} - ${splitEnd[0]} ${monthEnd}`;
}     


function getWeekNumberFromDate(date, startDate) {
    const diff = (date - startDate + ((startDate.getTimezoneOffset() - date.getTimezoneOffset()) * 60000));
    const oneWeek = 604800000; // Milisegundos en una semana
    return Math.floor(diff / oneWeek) + 1;
}


// Función para determinar si un evento ocurre en una semana específica
function eventOccursInWeek(event, week, minDate) {
    const startDate = parseDate(event["Inicio "]);
    const endDate = parseDate(event["Fin"]);
    const startWeek = getWeekNumberFromDate(startDate, minDate);
    const endWeek = getWeekNumberFromDate(endDate, minDate);
    return week >= startWeek && week <= endWeek;
}


function getFirstAndLastEventDates(data) {
    const dates = data.flatMap(item => [parseDate(item["Inicio "]), parseDate(item["Fin"])]);
    const validDates = dates.filter(date => date !== null);
    
    const minDate = new Date(Math.min(...validDates));
    const maxDate = new Date(Math.max(...validDates));
    
    return { minDate, maxDate };
}

function showF1Car(x, y) {
    const carImage = document.getElementById("f1Car");
    carImage.style.display = "block";
    carImage.style.left = `${x - 120}px`;
    carImage.style.top = `${y - 65}px`;

    const segments = [
        { startX: 142, startY: 216, endX: 1205, endY: 216, angle: 0 },    // Recta superior
        { startX: 1205, startY: 216, endX: 1284, endY: 308, curve: true, radius: 90, startAngle: 0, endAngle: 90 }, // Curva superior derecha
        { startX: 1284, startY: 308, endX: 1282, endY: 891, angle: 90 }, // Recta descendente
        { startX: 1282, startY: 891, endX: 1238, endY: 937, curve: true, radius: 50, startAngle: 90, endAngle: 180 }, // Curva inferior derecha
        { startX: 1238, startY: 937, endX: 170, endY: 937, angle: 180 }, // Recta inferior
        { startX: 170, startY: 937, endX: 124, endY: 892, curve: true, radius: 50, startAngle: 180, endAngle: 270 }, // Curva inferior izquierda
        { startX: 124, startY: 892, endX: 124, endY: 484, angle: 270 }  // Recta ascendente
    ];

    function calculateAngleForCurve(x, y, segment) {
        const startAngleRad = segment.startAngle * (Math.PI / 180);
        const centerX = segment.startX + segment.radius * Math.cos(startAngleRad + Math.PI / 2);
        const centerY = segment.startY + segment.radius * Math.sin(startAngleRad + Math.PI / 2);
        const dx = x - centerX;
        const dy = y - centerY;
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = angleRad * (180 / Math.PI);
    
        // Ajustar el ángulo para compensar el desplazamiento de +20 en `positionX`
        let adjustedAngle = (angleDeg + (segment.startAngle === 0 ? 90 : -90)) % 360;
    
        // Corrección para la curva inferior y superior
        if (segment.startAngle === 90 && segment.endAngle === 180) {
            adjustedAngle = (adjustedAngle + 180) % 360;
        }
    
        // Ajustes adicionales si el coche se muestra incorrectamente orientado
        if (segment.startAngle === 0 && x >= 1284) {
            adjustedAngle += 10; // Ajuste fino
        } else if (segment.startAngle === 180 && x <= 170) {
            adjustedAngle -= 10;
        }
    
        return adjustedAngle;
    }
    

    function getAngleForStraight(segment) {
        return segment.angle;
    }

    let segmentAngle = 0;
    let found = false;

    for (const segment of segments) {
        if (segment.curve) {
            const startAngleRad = segment.startAngle * (Math.PI / 180);
            const centerX = segment.startX + segment.radius * Math.cos(startAngleRad + Math.PI / 2);
            const centerY = segment.startY + segment.radius * Math.sin(startAngleRad + Math.PI / 2);
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (Math.abs(distance - segment.radius) <= 15) { // Ampliamos el margen
                segmentAngle = calculateAngleForCurve(x, y, segment);
                found = true;
                console.log(`Curva detectada en: (${x}, ${y}) - Ángulo: ${segmentAngle}`);
                break;
            }
        } else if (
            x >= Math.min(segment.startX, segment.endX) &&
            x <= Math.max(segment.startX, segment.endX) &&
            y >= Math.min(segment.startY, segment.endY) &&
            y <= Math.max(segment.startY, segment.endY)
        ) {
            segmentAngle = getAngleForStraight(segment);
            found = true;
            console.log(`Recta detectada en: (${x}, ${y}) - Ángulo: ${segmentAngle}`);
            break;
        }
    }

    if (!found) {
        console.warn("La posición del coche no está dentro de ningún segmento conocido.");
    }

    console.log(`Posición final: x: ${x}, y: ${y}, ángulo: ${segmentAngle}`);

    // Ajustar la orientación en la curva inferior izquierda y en la línea inferior
    if (y >= 892 && x <= 170) { // Si estamos en la línea inferior
        segmentAngle = (segmentAngle + 180) % 360; // Invertir el ángulo
    }
    if (y >= 937 && x <= 170) { // Al salir de la curva inferior izquierda
        segmentAngle = (segmentAngle + 180) % 360; // Invertir el ángulo
    }

    // Aseguramos que el auto esté orientado correctamente al final del recorrido
    if (segmentAngle === 270 && y < 892) {
        segmentAngle = 270;  // Mantener el ángulo de 270 grados cuando está subiendo
    }

    if(segmentAngle === 0 && x >= 1284.02 && y >= 303.44){
        segmentAngle = 90;
    }else if (segmentAngle === 0 && x >= 510 && y >= 590) {
        segmentAngle = 180;
    }  else if (segmentAngle === 0 && x >= 124 && y >= 590) {
        segmentAngle = 268;
    } else if (segmentAngle <= -262.77 && x >= 124 && y >= 590) {
        segmentAngle = 268;
    } else if(segmentAngle === 207.01028954229994 && x >= 1208.55 && y >= 937.00){
        segmentAngle = 182;
    } else if(segmentAngle === 113.03582750900509 && x >= 1283.89 && y >= 339.54){
        segmentAngle = 95;
    } else if (segmentAngle === 124.18884955407638 && x >= 1283.82 && y >= 359.54){
        segmentAngle = 90;
    } else if (segmentAngle === 223.36612617660631 && x >= 1188.55 && y >= 937.000){
        segmentAngle = 180;
    } else if (segmentAngle === -250.6838355977086 && x >= 124.00001525878906 && y >= 861.168945312){
        segmentAngle = 270;
    } else if (segmentAngle === 0 && x >= 124.00000762939453 && y >= 572.31884765625){
        segmentAngle = 270;
    }

    // Ajustar la rotación y escala del coche
    carImage.style.transform = `rotate(${segmentAngle}deg) scale(0.25)`;
}


setTimeout(() => {
    fetchData();
    hideTooltip();
}, 1000);

function addTooltipListeners() {
    // Añadir event listeners a los elementos `weekly-segment`
    document.querySelectorAll('.weekly-segment').forEach(segment => {
        segment.addEventListener('mouseover', (event) => {
            const week = segment.getAttribute('data-week');
            const lineweek = segment.getAttribute('weekdat');
            showTooltip(event, `Semana ${segment.getAttribute('data-week')}`, lineweek);
        });

        segment.addEventListener('mousemove', (event) => {
            showTooltip(event, `Semana ${segment.getAttribute('data-week')}`, `${segment.getAttribute('weekdat')}`);
        });

        segment.addEventListener('mouseout', hideTooltip);
    });

    // Añadir event listeners a los elementos `point-line`
    document.querySelectorAll('.point-line').forEach(line => {
        line.addEventListener('mouseover', (event) => {
            const tooltipText = line.week; // Usa el título como texto del tooltip
            const tooltipData =line.weekDataForm;
            showTooltip(event, `Semana ${line.week}`, `${line.weekDataForm}`); 
        });

        line.addEventListener('mousemove', (event) => {
            showTooltip(event, `Semana ${line.week}`, `${line.weekDataForm}`); 
            
        });

        line.addEventListener('mouseout', hideTooltip);
    });
}

const tooltip = document.getElementById('tooltip');

function showTooltip(event, title, content) {
    const tooltipTitle = document.getElementById('tooltip-title');
    const tooltipContent = document.getElementById('tooltip-content');
    
    tooltipTitle.textContent = title;
    tooltipContent.textContent = content;

    tooltip.style.display = 'block';
    tooltip.style.left = `${event.pageX + 10}px`; // Ajusta la posición según sea necesario
    tooltip.style.top = `${event.pageY + 10}px`;  // Ajusta la posición según sea necesario
}

function hideTooltip() {
    tooltip.style.display = 'none';
}
