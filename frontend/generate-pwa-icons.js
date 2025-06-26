// Simple PWA Icon Generator using Canvas API
// This creates basic icons from your existing logo

const fs = require('fs');
const path = require('path');

// For now, let's copy your existing logo to create basic icons
// You can replace this with a proper image resizing solution later

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceImage = 'src/assets/import.png';
const outputDir = 'public/icons';

// Create a simple HTML file that can generate icons using canvas
const htmlGenerator = `
<!DOCTYPE html>
<html>
<head>
    <title>PWA Icon Generator</title>
</head>
<body>
    <h1>PWA Icon Generator</h1>
    <p>Open browser console and run the generation script</p>
    <canvas id="canvas" style="border: 1px solid #ccc;"></canvas>
    <img id="sourceImg" src="src/assets/import.png" style="display: none;" crossorigin="anonymous">
    
    <script>
        function generateIcons() {
            const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            const img = document.getElementById('sourceImg');
            
            img.onload = function() {
                sizes.forEach(size => {
                    canvas.width = size;
                    canvas.height = size;
                    
                    // Clear canvas
                    ctx.clearRect(0, 0, size, size);
                    
                    // Draw image scaled to fit
                    ctx.drawImage(img, 0, 0, size, size);
                    
                    // Convert to blob and download
                    canvas.toBlob(function(blob) {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = \`icon-\${size}x\${size}.png\`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }, 'image/png');
                });
            };
            
            img.src = 'src/assets/import.png';
        }
        
        // Auto-generate when page loads
        window.onload = function() {
            console.log('Click the button or run generateIcons() to create PWA icons');
        };
    </script>
    
    <button onclick="generateIcons()">Generate PWA Icons</button>
    <p>This will download all required icon sizes. Place them in the public/icons/ directory.</p>
</body>
</html>
`;

// Write the HTML generator
fs.writeFileSync('icon-generator.html', htmlGenerator);

console.log('Icon generator created! Open icon-generator.html in your browser to generate PWA icons.');
console.log('After generating, move the downloaded icons to frontend/public/icons/');
