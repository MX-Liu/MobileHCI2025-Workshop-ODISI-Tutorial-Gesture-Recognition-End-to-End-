// UUIDs from the Arduino sketch
const CUSTOM_SERVICE_UUID = "19b10000-e8f2-537e-4f6c-d104768a1214";
const DATA_CHAR_UUID      = "19b10001-e8f2-537e-4f6c-d104768a1214";

// DOM Elements
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const statusDisplay = document.getElementById('status');
const axSpan = document.getElementById('ax');
const aySpan = document.getElementById('ay');
const azSpan = document.getElementById('az');
const gxSpan = document.getElementById('gx');
const gySpan = document.getElementById('gy');
const gzSpan = document.getElementById('gz');

// New DOM elements for recording
const labelInput = document.getElementById('labelInput');
const recordBtn = document.getElementById('recordBtn');
const saveBtn = document.getElementById('saveBtn');

// BLE state
let bleDevice;
let dataCharacteristic;

// App State
let isRecording = false;
let recordedData = [];

// Chart state
let imuChart;
const MAX_DATA_POINTS = 100;

// --- Event Listeners ---
connectBtn.addEventListener('click', connectToDevice);
disconnectBtn.addEventListener('click', disconnectDevice);
recordBtn.addEventListener('click', toggleRecording);
saveBtn.addEventListener('click', saveData);

// --- BLE Functions ---

async function connectToDevice() {
    try {
        updateStatus('Requesting Bluetooth Device...');
        bleDevice = await navigator.bluetooth.requestDevice({
            filters: [{ services: [CUSTOM_SERVICE_UUID] }],
        });

        bleDevice.addEventListener('gattserverdisconnected', onDisconnected);

        updateStatus('Connecting to GATT Server...');
        const server = await bleDevice.gatt.connect();

        updateStatus('Getting Service...');
        const service = await server.getPrimaryService(CUSTOM_SERVICE_UUID);

        updateStatus('Getting Characteristic...');
        dataCharacteristic = await service.getCharacteristic(DATA_CHAR_UUID);

        updateStatus('Starting Notifications...');
        await dataCharacteristic.startNotifications();
        dataCharacteristic.addEventListener('characteristicvaluechanged', handleNotifications);

        updateStatus('Connected!', true);
        connectBtn.disabled = true;
        disconnectBtn.disabled = false;
        recordBtn.disabled = false; // Enable recording
        
    } catch (error) {
        updateStatus(`Error: ${error}`);
        console.error(error);
    }
}

function disconnectDevice() {
    if (bleDevice && bleDevice.gatt.connected) {
        bleDevice.gatt.disconnect();
    }
    // The 'onDisconnected' event handler will manage the UI cleanup
}

function onDisconnected() {
    updateStatus('Disconnected');
    // Stop recording if it was active
    if (isRecording) {
        toggleRecording();
    }
    connectBtn.disabled = false;
    disconnectBtn.disabled = true;
    recordBtn.disabled = true;

    if (dataCharacteristic) {
        dataCharacteristic.removeEventListener('characteristicvaluechanged', handleNotifications);
        dataCharacteristic = null;
    }
    bleDevice = null;
}

function handleNotifications(event) {
    const value = event.target.value;
    if (value.byteLength !== 24) return;

    const ax = value.getFloat32(0, true);
    const ay = value.getFloat32(4, true);
    const az = value.getFloat32(8, true);
    const gx = value.getFloat32(12, true);
    const gy = value.getFloat32(16, true);
    const gz = value.getFloat32(20, true);

    const sensorData = { ax, ay, az, gx, gy, gz };

    updateUI(sensorData);
    updateChart(sensorData);

    // If recording, save the data
    if (isRecording) {
        const timestamp = Date.now();
        const label = labelInput.value.trim();
        recordedData.push([timestamp, label, ax, ay, az, gx, gy, gz]);
    }
}

// --- Recording and Saving Functions ---

function toggleRecording() {
    isRecording = !isRecording;
    if (isRecording) {
        // Start recording
        recordedData = []; // Clear previous data
        recordBtn.textContent = 'Stop Recording';
        recordBtn.classList.add('recording');
        labelInput.disabled = true;
        saveBtn.disabled = true;
        updateStatus('Recording...', true);
    } else {
        // Stop recording
        recordBtn.textContent = 'Start Recording';
        recordBtn.classList.remove('recording');
        labelInput.disabled = false;
        // Enable save button only if data was actually recorded
        if (recordedData.length > 0) {
            saveBtn.disabled = false;
        }
        updateStatus('Connected!', true);
    }
}

function saveData() {
    if (recordedData.length === 0) {
        alert('No data to save!');
        return;
    }

    // Create CSV header and content
    const header = "timestamp,label,ax,ay,az,gx,gy,gz\n";
    const csvContent = header + recordedData.map(row => row.join(',')).join('\n');

    // Create a Blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);

    // Generate a filename
    const firstLabel = recordedData[0][1] || 'data';
    const filename = `imu-${firstLabel}-${new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-')}.csv`;
    link.setAttribute("download", filename);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- UI and Chart Functions ---

function updateStatus(message, isConnected = false) {
    statusDisplay.textContent = message;
    if (isConnected) {
        statusDisplay.className = 'status-connected';
    } else {
        statusDisplay.className = 'status-disconnected';
    }
}

function updateUI(data) {
    axSpan.textContent = data.ax.toFixed(4);
    aySpan.textContent = data.ay.toFixed(4);
    azSpan.textContent = data.az.toFixed(4);
    gxSpan.textContent = data.gx.toFixed(4);
    gySpan.textContent = data.gy.toFixed(4);
    gzSpan.textContent = data.gz.toFixed(4);
}

function initChart() {
    const ctx = document.getElementById('imuChart').getContext('2d');
    imuChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Accel X', borderColor: 'rgba(255, 99, 132, 1)', data: [], borderWidth: 1, pointRadius: 0 },
                { label: 'Accel Y', borderColor: 'rgba(54, 162, 235, 1)', data: [], borderWidth: 1, pointRadius: 0 },
                { label: 'Accel Z', borderColor: 'rgba(75, 192, 192, 1)', data: [], borderWidth: 1, pointRadius: 0 },
                { label: 'Gyro X', borderColor: 'rgba(255, 206, 86, 1)', data: [], borderWidth: 1, pointRadius: 0, borderDash: [5, 5] },
                { label: 'Gyro Y', borderColor: 'rgba(153, 102, 255, 1)', data: [], borderWidth: 1, pointRadius: 0, borderDash: [5, 5] },
                { label: 'Gyro Z', borderColor: 'rgba(255, 159, 64, 1)', data: [], borderWidth: 1, pointRadius: 0, borderDash: [5, 5] }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { display: false }, y: { beginAtZero: false, ticks: { font: { size: 10 } } } },
            animation: { duration: 0 }
        }
    });
}

function updateChart(data) {
    if (imuChart.data.labels.length > MAX_DATA_POINTS) {
        imuChart.data.labels.shift();
        imuChart.data.datasets.forEach(dataset => dataset.data.shift());
    }
    imuChart.data.labels.push('');
    imuChart.data.datasets[0].data.push(data.ax);
    imuChart.data.datasets[1].data.push(data.ay);
    imuChart.data.datasets[2].data.push(data.az);
    imuChart.data.datasets[3].data.push(data.gx);
    imuChart.data.datasets[4].data.push(data.gy);
    imuChart.data.datasets[5].data.push(data.gz);
    imuChart.update();
}

window.onload = initChart;