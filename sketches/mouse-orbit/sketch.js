
let mouse = { x: 0, y: 0 };
let canvasElement = null;

// Adjustable parameters
export let props = {
    radius: {
        value: 20,
        params: {
            min: 1,
            max: 200,
            step: 1,
        },
    },
    orbitRadius: {
        value: 60,
        params: {
            min: 0,
            max: 300,
            step: 1,
        },
    },
    period: {
        value: 5,
        params: {
            min: 0.5,
            max: 20,
            step: 0.5,
        },
    },
};

// Handle mouse movement
let sketchSize = { width: 1, height: 1 };

const handleMouseMove = (event) => {
    const rect = canvasElement.getBoundingClientRect();
    
    mouse.x = (event.clientX - rect.left) * sketchSize.width / rect.width;
    mouse.y = (event.clientY - rect.top) * sketchSize.height / rect.height;
};

// Initialise the sketch
export const init = ({ canvas, width, height }) => {
    canvasElement = canvas;
    
    sketchSize.width = width;
    sketchSize.height = height;
    
    mouse.x = width / 2;
    mouse.y = height / 2;
    
    canvasElement.addEventListener('mousemove', handleMouseMove);
};

export const resize = ({ width, height }) => {
    sketchSize.width = width;
    sketchSize.height = height;
};

// Draw each frame
export const update = ({ context, width, height, time }) => {
    const radius = props.radius.value;
    const orbitRadius = props.orbitRadius.value;
    const period = props.period.value;
    
    // Time is in milliseconds
    const theta = 2 * Math.PI * time / (1000 * period);
    
    // Clear background
    context.fillStyle = '#134427';
    context.fillRect(0, 0, width, height);
    
    // Circle position relative to mouse
    const x = mouse.x + orbitRadius * Math.cos(theta);
    const y = mouse.y + orbitRadius * Math.sin(theta);
    
    // Draw circle
    context.fillStyle = 'blue';
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI);
    context.fill();
};

// Clean up when sketch is unloaded
export const dispose = () => {
    canvasElement?.removeEventListener('mousemove', handleMouseMove);
    canvasElement = null;
};

// Fragment rendering mode
export const rendering = '2d';
