// Prefijo que se usará como palabra clave para activar comandos
const ordenPrefijo = "BICHO";

// Espera a que el contenido del DOM esté completamente cargado antes de ejecutar el script
document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("startBtn");
    const outputText = document.getElementById("outputText");
    const msgText = document.getElementById("msgText");

    outputText.innerHTML = `Di ${ordenPrefijo} para ver el mensaje`;

    let recognition;
    let stoppedManually = false;

    if ("webkitSpeechRecognition" in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.lang = "es-ES";
    } else {
        alert("Tu navegador no soporta reconocimiento de voz.");
        return;
    }

    startBtn.addEventListener("click", () => {
        console.log("Botón presionado");
        stoppedManually = false;
        recognition.start();
        startBtn.disabled = true;
        outputText.textContent = `Escuchando... Di ${ordenPrefijo} para interactuar.`;
        msgText.innerHTML = "";
    });

    recognition.onresult = async (event) => {
        let transcript = event.results[event.results.length - 1][0].transcript.trim().toUpperCase();
        console.log("Texto reconocido:", transcript);

        if (transcript.includes(ordenPrefijo + " SALIR")) {
            stoppedManually = true;
            recognition.stop();
            startBtn.disabled = false;
            outputText.textContent = "Saliendo del modo de escucha.";
            msgText.innerHTML = "";
            return;
        }

        if (transcript.includes(ordenPrefijo)) {
            outputText.innerHTML = `Mensaje detectado: <strong><em>${transcript}</em></strong>`;
            msgText.innerHTML = "";

            try {
                const response = await fetch("http://44.211.232.62/api-gpt-php/endpoints/chat.php", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: transcript }),
                });

                const data = await response.json();

                if (data.status === 200) {
                    const reply = data.data.reply;
                    outputText.innerHTML = `Comando reconocido: <strong><em>${reply}</em></strong>`;
                } else {
                    outputText.innerHTML = `Error en la respuesta de OpenAI: <strong><em>${data.message}</em></strong>`;
                }
            } catch (error) {
                console.error("Error al enviar el mensaje a la API:", error);
                outputText.innerHTML = `Error en el servidor: <strong><em>${error.message}</em></strong>`;
            }
        }
    };

    recognition.onerror = (event) => {
        console.error("Error en el reconocimiento:", event.error);

        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            alert("Error: El micrófono no tiene permisos o fue bloqueado.");
        } else if (event.error === "network") {
            alert("Error: Problema de conexión con el servicio de reconocimiento de voz.");
        }

        recognition.stop();
        startBtn.disabled = false;
    };

    recognition.onend = () => {
        if (!stoppedManually) {
            msgText.innerHTML = "El reconocimiento de voz se detuvo inesperadamente<br>Habla nuevamente para continuar...";
            recognition.start();
        }
    };
});
