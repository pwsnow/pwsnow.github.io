with open('js/app.js', 'r') as f:
    text = f.read()

export_logic = """
        function hookExport(btnId, canvasId) {
            let btn = document.getElementById(btnId);
            if (!btn) return;
            btn.addEventListener('click', async () => {
                const canvas = document.getElementById(canvasId);
                const tempCanvas = document.createElement('canvas');
                const tCtx = tempCanvas.getContext('2d');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                tCtx.fillStyle = '#0f172a'; 
                tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                tCtx.drawImage(canvas, 0, 0);
                
                const dataUrl = tempCanvas.toDataURL('image/png');

                if ('showSaveFilePicker' in window) {
                    try {
                        const handle = await window.showSaveFilePicker({
                            suggestedName: `${canvasId}-export.png`,
                            types: [{ description: 'PNG Image', accept: {'image/png': ['.png']} }]
                        });
                        const response = await fetch(dataUrl);
                        const blob = await response.blob();
                        const writable = await handle.createWritable();
                        await writable.write(blob);
                        await writable.close();
                        return;
                    } catch (err) {
                        if (err.name === 'AbortError') return;
                    }
                }
                const link = document.createElement('a');
                link.download = `${canvasId}-export.png`;
                link.href = dataUrl;
                link.click();
            });
        }
        
        hookExport(id('downloadHeadroomBtn'), id('headroomChart'));
        hookExport(id('downloadTornadoBtn'), id('tornadoChart'));
        hookExport(id('downloadCeBtn'), id('cePlaneChart'));
"""

# Insert right before runModel() inside setupDashboard
target = "        function runModel() {"
text = text.replace(target, export_logic + "\n" + target)

with open('js/app.js', 'w') as f:
    f.write(text)

print("Patched app.js with export logical bindings")
