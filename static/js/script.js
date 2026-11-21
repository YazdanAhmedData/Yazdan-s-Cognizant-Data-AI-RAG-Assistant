
/* ==========================================
   YAZDAN'S RAG ASSISTANT
   FRONTEND CONTROLLER  ·  GLASS ORB EDITION
========================================== */
 
document.addEventListener("DOMContentLoaded", function () {
 
    // DOM ELEMENTS
 
    const questionBox = document.getElementById("question");
    const askButton = document.getElementById("askButton");
    const output = document.getElementById("output");
 
    const core = document.querySelector(".core-container");
    const orbTilt = document.getElementById("orbTilt");
    const orbWave = document.getElementById("orbWave");
    const coreStatus = document.getElementById("coreStatus");
    const coreCaption = document.getElementById("coreCaption");
 
    const outputStatus = document.getElementById("outputStatus");
    const outputStatusDot = document.getElementById("outputStatusDot");
 
    const processingIndicator = document.getElementById("processingIndicator");
    const responseTime = document.getElementById("responseTime");
    const charCount = document.getElementById("charCount");
 
    const copyButton = document.getElementById("copyButton");
    const toast = document.getElementById("toast");
 
    const buttonText = askButton.querySelector(".button-text");
 
    const reduceMotion =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 
    let isProcessing = false;
    let processingTimer = null;
    let readyTimer = null;
    let toastTimer = null;
    let lastAnswer = "";
 
 
    // PROCESSING MESSAGES
 
    const processingMessages = [
        "INITIALIZING NEURAL ENGINE",
        "GENERATING QUESTION EMBEDDINGS",
        "SEARCHING KNOWLEDGE BASE",
        "CALCULATING SEMANTIC SIMILARITY",
        "RETRIEVING RELEVANT COURSE CONTENT",
        "GENERATING INTELLIGENCE REPORT"
    ];
 
 
    // ======================================
    // ORB STATE CONTROL
    // states: ready | thinking | complete | error
    // ======================================
 
    function setCoreState(state) {
 
        core.dataset.state = state;
    }
 
    function triggerBurst() {
 
        core.classList.remove("burst");
 
        // Force reflow so the animation can restart.
        void core.offsetWidth;
 
        core.classList.add("burst");
 
        setTimeout(function () {
            core.classList.remove("burst");
        }, 1400);
    }
 
    function scheduleReturnToReady() {
 
        clearTimeout(readyTimer);
 
        readyTimer = setTimeout(function () {
 
            if (isProcessing) return;
 
            setCoreState("ready");
 
            coreStatus.textContent = "READY";
 
            coreCaption.textContent = "AWAITING YOUR COMMAND";
 
        }, 7000);
    }
 
 
    // ======================================
    // ORB WAVEFORM (generated bars)
    // ======================================
 
    (function buildWaveform() {
 
        if (!orbWave) return;
 
        const BARS = 29;
 
        for (let i = 0; i < BARS; i++) {
 
            const bar = document.createElement("span");
 
            bar.className = "wave-bar";
 
            // Bell-shaped envelope: tall in the middle, short at the edges.
            const envelope =
                Math.pow(Math.sin(Math.PI * (i + 0.5) / BARS), 1.4);
 
            bar.style.setProperty("--i", i);
            bar.style.setProperty("--env", envelope.toFixed(3));
 
            orbWave.appendChild(bar);
        }
    })();
 
 
    // ======================================
    // ORB POINTER INTERACTION (tilt + light)
    // ======================================
 
    (function orbPointerEffects() {
 
        if (reduceMotion || !orbTilt) return;
 
        if (window.matchMedia("(pointer: coarse)").matches) return;
 
        let frame = null;
        let pointerX = 0;
        let pointerY = 0;
 
        function update() {
 
            frame = null;
 
            const rect = core.getBoundingClientRect();
 
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
 
            // Normalised distance from the orb, clamped to -1..1
            const dx = Math.max(-1, Math.min(1,
                (pointerX - centerX) / (window.innerWidth / 2)));
 
            const dy = Math.max(-1, Math.min(1,
                (pointerY - centerY) / (window.innerHeight / 2)));
 
            orbTilt.style.setProperty("--ry", (dx * 14).toFixed(2) + "deg");
            orbTilt.style.setProperty("--rx", (-dy * 14).toFixed(2) + "deg");
 
            // Move the specular highlight toward the cursor.
            core.style.setProperty("--mx", (32 + dx * 22).toFixed(1) + "%");
            core.style.setProperty("--my", (22 + dy * 22).toFixed(1) + "%");
        }
 
        window.addEventListener("pointermove", function (event) {
 
            pointerX = event.clientX;
            pointerY = event.clientY;
 
            if (frame === null) {
                frame = requestAnimationFrame(update);
            }
        });
 
        document.addEventListener("pointerleave", function () {
 
            orbTilt.style.setProperty("--rx", "0deg");
            orbTilt.style.setProperty("--ry", "0deg");
 
            core.style.setProperty("--mx", "32%");
            core.style.setProperty("--my", "22%");
        });
    })();
 
 
    // ======================================
    // BACKGROUND PARTICLES
    // ======================================
 
    (function backgroundParticles() {
 
        if (reduceMotion) return;
 
        const canvas = document.createElement("canvas");
 
        canvas.className = "bg-particles";
 
        document.body.prepend(canvas);
 
        const ctx = canvas.getContext("2d");
 
        const COUNT = 55;
        const LINK_DISTANCE = 120;
 
        let width = 0;
        let height = 0;
        let particles = [];
 
        function resize() {
 
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
 
            width = window.innerWidth;
            height = window.innerHeight;
 
            canvas.width = width * ratio;
            canvas.height = height * ratio;
 
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        }
 
        function createParticles() {
 
            particles = [];
 
            for (let i = 0; i < COUNT; i++) {
 
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.25,
                    vy: (Math.random() - 0.5) * 0.25,
                    r: Math.random() * 1.4 + 0.4,
                    hue: Math.random() > 0.5 ? "102,225,255" : "152,112,255"
                });
            }
        }
 
        function draw() {
 
            if (document.hidden) {
                requestAnimationFrame(draw);
                return;
            }
 
            const boost = core.dataset.state === "thinking" ? 2.6 : 1;
 
            ctx.clearRect(0, 0, width, height);
 
            for (let i = 0; i < particles.length; i++) {
 
                const p = particles[i];
 
                p.x += p.vx * boost;
                p.y += p.vy * boost;
 
                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;
 
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.hue},0.55)`;
                ctx.fill();
 
                for (let j = i + 1; j < particles.length; j++) {
 
                    const q = particles[j];
 
                    const dx = p.x - q.x;
                    const dy = p.y - q.y;
 
                    const distance = Math.sqrt(dx * dx + dy * dy);
 
                    if (distance < LINK_DISTANCE) {
 
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(q.x, q.y);
                        ctx.strokeStyle =
                            `rgba(110,130,255,${(1 - distance / LINK_DISTANCE) * 0.12})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
 
            requestAnimationFrame(draw);
        }
 
        resize();
        createParticles();
        draw();
 
        window.addEventListener("resize", function () {
            resize();
            createParticles();
        });
    })();
 
 
    // ======================================
    // TOAST
    // ======================================
 
    function showToast(message, isError) {
 
        toast.textContent = message;
 
        toast.classList.toggle("error", Boolean(isError));
        toast.classList.add("show");
 
        clearTimeout(toastTimer);
 
        toastTimer = setTimeout(function () {
            toast.classList.remove("show");
        }, 2600);
    }
 
 
    // ======================================
    // SUGGESTED QUESTIONS
    // ======================================
 
    window.setQuestion = function (value) {
 
        if (isProcessing) return;
 
        questionBox.value = value;
 
        updateCharacterCount();
 
        questionBox.focus();
    };
 
 
    // ======================================
    // CHARACTER COUNTER
    // ======================================
 
    function updateCharacterCount() {
 
        const count = questionBox.value.length;
 
        charCount.textContent = `${count} / 2000`;
 
        charCount.classList.toggle("warn", count > 1800);
    }
 
    questionBox.addEventListener("input", updateCharacterCount);
 
 
    // ======================================
    // KEYBOARD SHORTCUT
    // ======================================
 
    questionBox.addEventListener("keydown", function (event) {
 
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
 
            event.preventDefault();
 
            askQuestion();
        }
    });
 
 
    // ======================================
    // COPY RESPONSE
    // ======================================
 
    copyButton.addEventListener("click", async function () {
 
        if (!lastAnswer) return;
 
        try {
 
            await navigator.clipboard.writeText(lastAnswer);
 
            showToast("✦ RESPONSE COPIED TO CLIPBOARD");
 
        } catch (error) {
 
            // Fallback for browsers without clipboard permission.
            const helper = document.createElement("textarea");
 
            helper.value = lastAnswer;
            helper.style.position = "fixed";
            helper.style.opacity = "0";
 
            document.body.appendChild(helper);
            helper.select();
 
            try {
                document.execCommand("copy");
                showToast("✦ RESPONSE COPIED TO CLIPBOARD");
            } catch (copyError) {
                showToast("COULD NOT COPY RESPONSE", true);
            }
 
            document.body.removeChild(helper);
        }
    });
 
 
    // ======================================
    // SYSTEM STATUS
    // ======================================
 
    function setSystemStatus(status, message) {
 
        outputStatus.textContent = message;
 
        if (status === "thinking") {
 
            outputStatusDot.style.background = "#39dfff";
 
            outputStatusDot.style.boxShadow =
                "0 0 12px #39dfff";
 
        } else if (status === "success") {
 
            outputStatusDot.style.background = "#42edb0";
 
            outputStatusDot.style.boxShadow =
                "0 0 12px #42edb0";
 
        } else if (status === "error") {
 
            outputStatusDot.style.background = "#ff667d";
 
            outputStatusDot.style.boxShadow =
                "0 0 12px #ff667d";
 
        } else {
 
            outputStatusDot.style.background = "#7a86a9";
 
            outputStatusDot.style.boxShadow = "none";
        }
    }
 
 
    // ======================================
    // START THINKING ANIMATION
    // ======================================
 
    function startThinking() {
 
        clearTimeout(readyTimer);
 
        core.classList.add("active");
 
        setCoreState("thinking");
 
        coreStatus.textContent = "THINKING";
 
        coreCaption.textContent =
            "ANALYSING YOUR QUESTION";
 
        processingIndicator.lastElementChild.textContent =
            "NEURAL ENGINE ACTIVE";
 
        setSystemStatus("thinking", "PROCESSING REQUEST");
 
        responseTime.textContent = "Calculating...";
 
        copyButton.disabled = true;
 
        let messageIndex = 0;
 
        output.classList.remove("reveal");
 
        output.innerHTML = `
            <div class="loading-text">
 
                <div class="loading-title">
                    ✦ YAZDAN'S RAG ASSISTANT IS THINKING
                </div>
 
                <div class="loading-step" id="loadingStep">
                    ${processingMessages[0]}
                </div>
 
                <div class="loading-bar"></div>
 
                <p style="
                    margin-top:25px;
                    color:#8294bd;
                ">
                    Accessing your Cognizant Data & AI
                    knowledge base.
 
                    Please wait while your intelligence
                    report is generated.
                </p>
 
            </div>
        `;
 
        processingTimer = setInterval(function () {
 
            messageIndex =
                (messageIndex + 1) % processingMessages.length;
 
            const step = document.getElementById("loadingStep");
 
            if (step) {
 
                step.textContent =
                    processingMessages[messageIndex];
            }
 
        }, 2500);
    }
 
 
    // ======================================
    // STOP THINKING ANIMATION
    // ======================================
 
    function stopThinking() {
 
        core.classList.remove("active");
 
        if (processingTimer !== null) {
 
            clearInterval(processingTimer);
 
            processingTimer = null;
        }
    }
 
 
    // ======================================
    // MARKDOWN RESPONSE RENDERING
    // ======================================
 
    function playRevealAnimation() {
 
        output.classList.remove("reveal");
 
        void output.offsetWidth;
 
        output.classList.add("reveal");
 
        output.scrollTop = 0;
    }
 
    function renderMarkdown(answer) {
 
        // Check whether the Markdown libraries loaded.
 
        if (
            typeof marked === "undefined" ||
            typeof DOMPurify === "undefined"
        ) {
 
            console.warn(
                "Markdown libraries unavailable. Displaying plain text."
            );
 
            output.textContent = answer;
 
            return;
        }
 
        // Configure Markdown renderer.
 
        marked.setOptions({
 
            gfm: true,
 
            breaks: true,
 
            headerIds: false,
 
            mangle: false
 
        });
 
        // Convert Markdown into HTML.
 
        const rawHTML = marked.parse(answer);
 
        // Sanitize generated HTML before displaying it.
 
        const safeHTML = DOMPurify.sanitize(rawHTML, {
 
            USE_PROFILES: {
                html: true
            },
 
            FORBID_TAGS: [
                "script",
                "iframe",
                "object",
                "embed",
                "form"
            ],
 
            FORBID_ATTR: [
                "onerror",
                "onclick",
                "onload"
            ]
 
        });
 
        // Display formatted response.
 
        output.innerHTML = safeHTML;
 
        // Open external links safely in a new tab.
 
        output.querySelectorAll("a").forEach(function (link) {
 
            link.setAttribute("target", "_blank");
 
            link.setAttribute("rel", "noopener noreferrer");
 
        });
    }
 
 
    // ======================================
    // SUCCESS STATE
    // ======================================
 
    function showSuccess(answer, duration) {
 
        stopThinking();
 
        setCoreState("complete");
 
        triggerBurst();
 
        coreStatus.textContent = "COMPLETE";
 
        coreCaption.textContent =
            "INTELLIGENCE GENERATED SUCCESSFULLY";
 
        processingIndicator.lastElementChild.textContent =
            "NEURAL ENGINE STANDBY";
 
        setSystemStatus("success", "RESPONSE GENERATED");
 
        // Render Markdown instead of displaying ## and **.
 
        renderMarkdown(answer);
 
        playRevealAnimation();
 
        lastAnswer = answer;
 
        copyButton.disabled = false;
 
        responseTime.textContent =
            `${duration.toFixed(1)}s`;
 
        scheduleReturnToReady();
    }
 
 
    // ======================================
    // ERROR STATE
    // ======================================
 
    function showError(message) {
 
        stopThinking();
 
        setCoreState("error");
 
        coreStatus.textContent = "ERROR";
 
        coreCaption.textContent =
            "SYSTEM ENCOUNTERED AN ERROR";
 
        processingIndicator.lastElementChild.textContent =
            "NEURAL ENGINE STANDBY";
 
        setSystemStatus("error", "REQUEST FAILED");
 
        responseTime.textContent = "--";
 
        lastAnswer = "";
 
        copyButton.disabled = true;
 
        // Use textContent to safely display errors.
 
        output.classList.remove("reveal");
 
        output.textContent =
            "Unable to generate your intelligence report.\n\n" +
            message +
            "\n\nPlease check that Flask, Ollama and your RAG pipeline are running correctly.";
 
        scheduleReturnToReady();
    }
 
 
    // ======================================
    // MAIN QUESTION FUNCTION
    // ======================================
 
    window.askQuestion = async function () {
 
        if (isProcessing) return;
 
        const question = questionBox.value.trim();
 
        // Validate question.
 
        if (!question) {
 
            showToast("PLEASE ENTER A QUESTION FIRST", true);
 
            questionBox.focus();
 
            return;
        }
 
        isProcessing = true;
 
        const startTime = performance.now();
 
        askButton.disabled = true;
 
        buttonText.textContent = "PROCESSING REQUEST";
 
        startThinking();
 
        try {
 
            // Send question to Flask backend.
 
            const response = await fetch("/ask", {
 
                method: "POST",
 
                headers: {
 
                    "Content-Type": "application/json"
 
                },
 
                body: JSON.stringify({
 
                    question: question
 
                })
 
            });
 
 
            // Read server response.
 
            const rawResponse = await response.text();
 
            let data;
 
            try {
 
                data = JSON.parse(rawResponse);
 
            } catch (error) {
 
                throw new Error(
                    "The server returned an invalid response. Check the Flask terminal."
                );
            }
 
 
            // Handle backend errors.
 
            if (!response.ok) {
 
                throw new Error(
                    data.error ||
                    "The RAG pipeline encountered an error."
                );
            }
 
 
            // Validate AI answer.
 
            if (
                typeof data.answer !== "string" ||
                !data.answer.trim()
            ) {
 
                throw new Error(
                    "The AI returned an empty response."
                );
            }
 
 
            // Calculate processing duration.
 
            const duration =
                (performance.now() - startTime) / 1000;
 
 
            // Display formatted answer.
 
            showSuccess(data.answer, duration);
 
 
        } catch (error) {
 
            console.error(
                "Yazdan's RAG Assistant Error:",
                error
            );
 
            showError(error.message);
 
 
        } finally {
 
            isProcessing = false;
 
            askButton.disabled = false;
 
            buttonText.textContent = "INITIATE SEARCH";
 
        }
 
    };
 
 
    // ======================================
    // INITIALIZATION
    // ======================================
 
    updateCharacterCount();
 
    setCoreState("ready");
 
    setSystemStatus("ready", "AWAITING INPUT");
 
    console.log(
        "Yazdan's RAG Assistant initialized successfully."
    );
 
});